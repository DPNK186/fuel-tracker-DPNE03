import { db } from '../db/db';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '425147321997-ojjgks40prnbj1npse9c7o4jqjms4gp9.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

// Hàm trợ giúp đọc thông tin lỗi an toàn
async function parseErrorResponse(response) {
  try {
    const rawText = await response.text();
    try {
      const errData = JSON.parse(rawText);
      return errData.error?.message || response.statusText || 'Lỗi không xác định';
    } catch {
      return rawText || response.statusText || 'Lỗi không xác định';
    }
  } catch {
    return response.statusText || 'Lỗi không xác định';
  }
}

// Thực hiện ghi dữ liệu đã restore vào Dexie
export async function importToDB(data) {
  // 1. Xác thực cấu trúc dữ liệu nghiêm ngặt (Schema Validation) trước khi xóa dữ liệu cũ
  if (!data || data.version !== 1 || !Array.isArray(data.vehicles) || !Array.isArray(data.refuelings) || !Array.isArray(data.expenses)) {
    throw new Error('Định dạng dữ liệu không hợp lệ hoặc thiếu thông tin phiên bản.');
  }

  // Tương thích ngược: Đảm bảo các phương tiện đều có updatedAt khi nhập vào máy
  const nowIso = new Date().toISOString();
  const sanitizedVehicles = data.vehicles.map(v => ({
    ...v,
    updatedAt: v.updatedAt || nowIso
  }));

  // 2. Thực hiện xóa và thêm mới trong một Transaction để đảm bảo tính nguyên tử
  await db.transaction('rw', db.vehicles, db.refuelings, db.expenses, async () => {
    // Xóa song song dữ liệu cũ (Tối ưu hóa hiệu năng)
    await Promise.all([
      db.vehicles.clear(),
      db.refuelings.clear(),
      db.expenses.clear()
    ]);

    // Thêm song song dữ liệu mới (Tối ưu hóa hiệu năng)
    await Promise.all([
      db.vehicles.bulkAdd(sanitizedVehicles),
      db.refuelings.bulkAdd(data.refuelings),
      db.expenses.bulkAdd(data.expenses)
    ]);
  });
}

// Kiểm tra xem cơ sở dữ liệu IndexedDB hiện tại đang trống hoặc chỉ chứa dữ liệu mẫu
export async function isLocalDBEmptyOrSample() {
  try {
    const vehicles = await db.vehicles.toArray();
    if (vehicles.length === 0) return true;
    if (vehicles.length === 1) {
      const v = vehicles[0];
      // Xe Honda Vision có biển số '29A-123.45' là xe mẫu mặc định được populate
      if (v.plateNumber === '29A-123.45') {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// Chuẩn hóa biển số xe (Xóa khoảng trắng, dấu chấm, dấu gạch ngang và đưa về chữ hoa)
export function normalizePlate(plate) {
  if (!plate) return '';
  return plate.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const DELETED_VEHICLES_KEY = 'fuel_tracker_deleted_vehicles';

// Lấy danh sách các xe đã bị xóa tại thiết bị
export function getDeletedVehicles() {
  try {
    const raw = localStorage.getItem(DELETED_VEHICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Lưu vết một xe vừa bị xóa tại thiết bị
export function trackDeletedVehicle(vehicle) {
  if (!vehicle) return;
  try {
    const list = getDeletedVehicles();
    const normPlate = normalizePlate(vehicle.plateNumber);
    // Loại bỏ mục cũ nếu có để cập nhật mốc thời gian deletedAt mới nhất
    const filtered = list.filter(item => {
      const matchId = (vehicle.id && (item.id === vehicle.id || item.id?.toString() === vehicle.id?.toString()));
      const matchPlate = (normPlate && normalizePlate(item.plateNumber) === normPlate);
      return !matchId && !matchPlate;
    });

    filtered.push({
      id: vehicle.id,
      name: vehicle.name || 'Phương tiện không tên',
      plateNumber: vehicle.plateNumber || '',
      type: vehicle.type || 'Motorcycle',
      tankCapacity: vehicle.tankCapacity || null,
      deletedAt: new Date().toISOString()
    });

    localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Lỗi lưu vết xe đã xóa:', e);
  }
}

// Dọn dẹp một xe khỏi danh sách theo dõi xe đã xóa (sau khi đã xóa trên Cloud hoặc khôi phục về máy)
export function removeDeletedVehicle(identifier) {
  if (!identifier) return;
  try {
    let list = getDeletedVehicles();
    const normInput = typeof identifier === 'string' ? normalizePlate(identifier) : '';
    list = list.filter(item => {
      if (item.id === identifier || item.id?.toString() === identifier?.toString()) return false;
      if (normInput && normalizePlate(item.plateNumber) === normInput) return false;
      return true;
    });
    localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Lỗi dọn dẹp xe đã xóa:', e);
  }
}

// Xóa sạch danh sách theo dõi xe đã xóa
export function clearDeletedVehicles() {
  localStorage.removeItem(DELETED_VEHICLES_KEY);
}

// Hợp nhất danh sách xe từ Local và Cloud (Tự động gộp các xe có cùng biển số xe)
function mergeVehicles(localList = [], cloudList = []) {
  const mergedVehiclesMap = new Map();
  const vehicleIdRemap = new Map();

  const allVehicles = [...cloudList, ...localList].filter(Boolean);

  allVehicles.forEach(v => {
    if (!v || !v.id) return;
    const vId = v.id;
    const normPlate = normalizePlate(v.plateNumber);

    let canonicalVehicle = null;

    if (normPlate) {
      canonicalVehicle = Array.from(mergedVehiclesMap.values()).find(
        existing => normalizePlate(existing.plateNumber) === normPlate
      );
    }

    if (!canonicalVehicle && mergedVehiclesMap.has(vId)) {
      canonicalVehicle = mergedVehiclesMap.get(vId);
    }

    if (canonicalVehicle) {
      const canonicalId = canonicalVehicle.id;
      vehicleIdRemap.set(vId, canonicalId);
      vehicleIdRemap.set(vId.toString(), canonicalId);
      if (!isNaN(Number(vId))) vehicleIdRemap.set(Number(vId), canonicalId);

      const bestUpdatedAt = [canonicalVehicle.updatedAt, v.updatedAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

      const mergedObj = {
        ...canonicalVehicle,
        ...v,
        id: canonicalId,
        name: canonicalVehicle.name || v.name,
        plateNumber: canonicalVehicle.plateNumber || v.plateNumber,
        tankCapacity: canonicalVehicle.tankCapacity || v.tankCapacity,
        updatedAt: bestUpdatedAt
      };
      mergedVehiclesMap.set(canonicalId, mergedObj);
    } else {
      mergedVehiclesMap.set(vId, { ...v });
      vehicleIdRemap.set(vId, vId);
      vehicleIdRemap.set(vId.toString(), vId);
      if (!isNaN(Number(vId))) vehicleIdRemap.set(Number(vId), vId);
    }
  });

  return {
    vehicles: Array.from(mergedVehiclesMap.values()),
    vehicleIdRemap
  };
}

// Hợp nhất lịch sử đổ xăng từ Local và Cloud
function mergeRefuelings(localList = [], cloudList = [], vehicleIdRemap = new Map()) {
  const map = new Map();

  const getCanonicalVehicleId = (vId) => {
    if (!vId) return vId;
    return vehicleIdRemap.get(vId) ?? vehicleIdRemap.get(Number(vId)) ?? vehicleIdRemap.get(vId.toString()) ?? vId;
  };

  const processItem = (item) => {
    if (!item) return null;
    const canonicalVehicleId = getCanonicalVehicleId(item.vehicleId);
    return { ...item, vehicleId: canonicalVehicleId };
  };

  const getRefuelingSignature = (item) => {
    if (!item) return '';
    if (item.id) return `id_${item.id}`;
    return `sig_${item.vehicleId}_${item.date}_${item.odometer}_${item.totalCost}`;
  };

  cloudList.forEach(rawItem => {
    const item = processItem(rawItem);
    if (!item) return;
    const key = getRefuelingSignature(item);
    if (key) map.set(key, { ...item });
  });

  localList.forEach(rawItem => {
    const item = processItem(rawItem);
    if (!item) return;
    const key = getRefuelingSignature(item);
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, ...item });
    } else {
      const foundMatching = Array.from(map.values()).find(c => 
        c.vehicleId?.toString() === item.vehicleId?.toString() &&
        c.date === item.date &&
        Math.abs(Number(c.odometer || 0) - Number(item.odometer || 0)) < 0.1 &&
        Math.abs(Number(c.totalCost || 0) - Number(item.totalCost || 0)) < 1
      );
      if (foundMatching) {
        const foundKey = getRefuelingSignature(foundMatching);
        map.set(foundKey, { ...foundMatching, ...item, id: foundMatching.id });
      } else {
        map.set(key, { ...item });
      }
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(a.date) - new Date(b.date));
  return merged;
}

// Hợp nhất các khoản chi phí từ Local và Cloud
function mergeExpenses(localList = [], cloudList = [], vehicleIdRemap = new Map()) {
  const map = new Map();

  const getCanonicalVehicleId = (vId) => {
    if (!vId) return vId;
    return vehicleIdRemap.get(vId) ?? vehicleIdRemap.get(Number(vId)) ?? vehicleIdRemap.get(vId.toString()) ?? vId;
  };

  const processItem = (item) => {
    if (!item) return null;
    const canonicalVehicleId = getCanonicalVehicleId(item.vehicleId);
    return { ...item, vehicleId: canonicalVehicleId };
  };

  const getExpenseSignature = (item) => {
    if (!item) return '';
    if (item.id) return `id_${item.id}`;
    return `sig_${item.vehicleId}_${item.date}_${item.amount}_${item.category}`;
  };

  cloudList.forEach(rawItem => {
    const item = processItem(rawItem);
    if (!item) return;
    const key = getExpenseSignature(item);
    if (key) map.set(key, { ...item });
  });

  localList.forEach(rawItem => {
    const item = processItem(rawItem);
    if (!item) return;
    const key = getExpenseSignature(item);
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, ...item });
    } else {
      const foundMatching = Array.from(map.values()).find(c => 
        c.vehicleId?.toString() === item.vehicleId?.toString() &&
        c.date === item.date &&
        c.category === item.category &&
        Math.abs(Number(c.amount || 0) - Number(item.amount || 0)) < 1
      );
      if (foundMatching) {
        const foundKey = getExpenseSignature(foundMatching);
        map.set(foundKey, { ...foundMatching, ...item, id: foundMatching.id });
      } else {
        map.set(key, { ...item });
      }
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(a.date) - new Date(b.date));
  return merged;
}

export const googleDriveService = {
  // Timer lưu trữ retry ngầm
  retryTimer: null,

  // Timer duy trì token ngầm
  proactiveRefreshTimer: null,

  // Google GIS Token Client
  tokenClient: null,

  // Các Promise resolve khi nhận callback từ GIS
  pendingResolvers: [],

  // Chờ thư viện Google SDK sẵn sàng (tối đa timeoutMs)
  waitForGoogleSDK(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - startTime >= timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  },

  // Khởi tạo Google Token Client
  initTokenClient() {
    if (this.tokenClient) return this.tokenClient;
    if (!window.google?.accounts?.oauth2) return null;

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        const isError = !!tokenResponse.error;
        if (!isError) {
          const accessToken = tokenResponse.access_token;
          const expiresIn = tokenResponse.expires_in; // thời gian sống (giây)
          const expiresAt = new Date().getTime() + parseInt(expiresIn) * 1000;

          localStorage.setItem('google_access_token', accessToken);
          localStorage.setItem('google_token_expires_at', expiresAt.toString());
          localStorage.setItem('google_logged_in', 'true');

          // Lên lịch gia hạn tự động ngầm trước khi token hết hạn
          this.scheduleProactiveRefresh(parseInt(expiresIn));

          window.dispatchEvent(new CustomEvent('google-drive-login-success'));
        } else {
          console.error('Google OAuth Callback Error:', tokenResponse.error);
        }

        // Gọi tất cả resolver đang chờ nhận kết quả
        const resolvers = [...this.pendingResolvers];
        this.pendingResolvers = [];
        resolvers.forEach(resolve => resolve(!isError));
      }
    });

    return this.tokenClient;
  },

  // Đặt lịch làm mới token ngầm trước khi token hết hạn 15 phút (hoặc tối thiểu 30 giây)
  scheduleProactiveRefresh(expiresInSeconds) {
    if (this.proactiveRefreshTimer) {
      clearTimeout(this.proactiveRefreshTimer);
      this.proactiveRefreshTimer = null;
    }

    // Thời điểm làm mới: Trước khi hết hạn 15 phút (900s), tối thiểu sau 30 giây
    const refreshDelayMs = Math.max(30000, (expiresInSeconds - 900) * 1000);

    this.proactiveRefreshTimer = setTimeout(() => {
      if (this.isConnected()) {
        this.refreshTokenSilently();
      }
    }, refreshDelayMs);
  },

  // Lấy Access Token từ localStorage (chỉ trả về nếu còn hạn)
  getAccessToken() {
    const token = localStorage.getItem('google_access_token');
    const expiresAt = localStorage.getItem('google_token_expires_at');

    if (token && expiresAt) {
      if (new Date().getTime() < parseInt(expiresAt)) {
        return token;
      }
    }
    return null;
  },

  // Đảm bảo lấy được Access Token hợp lệ (trả về null nếu đã hết hạn)
  async ensureValidToken() {
    return this.getAccessToken();
  },

  // Gọi đăng nhập Google hiển thị Popup
  async login() {
    if (!CLIENT_ID) {
      alert('Vui lòng cấu hình VITE_GOOGLE_CLIENT_ID trong file .env');
      return;
    }

    const sdkReady = await this.waitForGoogleSDK(5000);
    if (!sdkReady) {
      alert('Thư viện đăng nhập Google chưa thể tải xong, vui lòng kiểm tra kết nối mạng và thử lại sau.');
      return;
    }

    const client = this.initTokenClient();
    if (client) {
      client.requestAccessToken();
    }
  },

  // Làm mới token ngầm không hiện popup
  async refreshTokenSilently() {
    const sdkReady = await this.waitForGoogleSDK(5000);
    if (!sdkReady) {
      return false;
    }

    return new Promise((resolve) => {
      const client = this.initTokenClient();
      if (client) {
        this.pendingResolvers.push(resolve);
        // Sử dụng prompt: 'none' chuẩn Google GIS để đảm bảo 100% không bao giờ tự ý bật popup màn hình
        client.requestAccessToken({ prompt: 'none' });
      } else {
        resolve(false);
      }
    });
  },

  logout() {
    if (this.proactiveRefreshTimer) {
      clearTimeout(this.proactiveRefreshTimer);
      this.proactiveRefreshTimer = null;
    }
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_logged_in');
    localStorage.removeItem('google_drive_last_synced');
    localStorage.removeItem('google_drive_last_synced_cloud_timestamp');
    localStorage.removeItem('google_drive_unsynced_changes');
    window.dispatchEvent(new CustomEvent('google-drive-logout'));
  },

  // Kiểm tra xem đã kết nối tài khoản chưa (dựa trên cờ logged_in)
  isConnected() {
    return localStorage.getItem('google_logged_in') === 'true';
  },

  // Đồng bộ: Sao lưu dữ liệu lên Google Drive AppData
  async backup(data) {
    const token = await this.ensureValidToken();
    if (!token) throw new Error('Chưa đăng nhập Google');

    const fileName = 'fuel_tracker_backup.json';
    
    // 1. Tìm kiếm xem file backup đã tồn tại chưa trong appDataFolder
    const query = `name='${fileName}' and 'appDataFolder' in parents`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchResponse.ok) {
      const errMsg = await parseErrorResponse(searchResponse);
      throw new Error(`Kiểm tra file trên Drive thất bại: ${errMsg}`);
    }
    
    const searchResult = await searchResponse.json();
    const existingFile = searchResult.files && searchResult.files[0];
    
    // Chuẩn bị dữ liệu và metadata
    const fileContent = JSON.stringify(data, null, 2);
    const metadata = {
      name: fileName,
      parents: ['appDataFolder']
    };
    
    let uploadUrl = '';
    let method = 'POST';
    
    if (existingFile) {
      // Nếu đã có file, thực hiện cập nhật (update)
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      method = 'PATCH';
    } else {
      // Nếu chưa có file, thực hiện tạo mới (create)
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
      method = 'POST';
    }

    if (method === 'PATCH') {
      // Cập nhật nội dung file hiện tại
      const response = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: fileContent
      });
      
      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        throw new Error(`Cập nhật file sao lưu thất bại: ${errMsg}`);
      }
      
      const result = await response.json();
      localStorage.setItem('google_drive_last_synced', new Date().toISOString());
      if (data && data.timestamp) {
        localStorage.setItem('google_drive_last_synced_cloud_timestamp', data.timestamp);
      }
      localStorage.removeItem('google_drive_unsynced_changes');
      return result;
    } else {
      // Multipart upload cho file mới
      const boundary = 'foo_bar_boundary';
      const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${fileContent}\r\n` +
        `--${boundary}--`;
        
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });
      
      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        throw new Error(`Tạo file sao lưu mới thất bại: ${errMsg}`);
      }
      
      const result = await response.json();
      localStorage.setItem('google_drive_last_synced', new Date().toISOString());
      if (data && data.timestamp) {
        localStorage.setItem('google_drive_last_synced_cloud_timestamp', data.timestamp);
      }
      localStorage.removeItem('google_drive_unsynced_changes');
      return result;
    }
  },

  // Đồng bộ: Phục hồi dữ liệu từ Google Drive
  async restore() {
    const token = await this.ensureValidToken();
    if (!token) throw new Error('Chưa đăng nhập Google');

    const fileName = 'fuel_tracker_backup.json';
    
    // Tìm kiếm file backup
    const query = `name='${fileName}' and 'appDataFolder' in parents`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!searchResponse.ok) {
      const errMsg = await parseErrorResponse(searchResponse);
      throw new Error(`Tìm kiếm dữ liệu trên Drive thất bại: ${errMsg}`);
    }
    
    const searchResult = await searchResponse.json();
    const existingFile = searchResult.files && searchResult.files[0];
    
    if (!existingFile) {
      throw new Error('Không tìm thấy bản sao lưu nào trên Google Drive');
    }
    
    // Tải nội dung file bằng ID
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`;
    const downloadResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!downloadResponse.ok) {
      const errMsg = await parseErrorResponse(downloadResponse);
      throw new Error(`Tải file sao lưu thất bại: ${errMsg}`);
    }
    
    return await downloadResponse.json();
  }
};

// Định dạng giờ an toàn không bao giờ throw hoặc sinh ra "Invalid Date"
export function formatSafeTime(dateVal, fallback = 'Không rõ giờ') {
  if (!dateVal) return fallback;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Định dạng ngày giờ an toàn
export function formatSafeDateTime(dateVal, fallback = 'Không rõ thời gian') {
  if (!dateVal) return fallback;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleString('vi-VN');
}

// Tìm mốc thời gian bản ghi gần nhất (dành cho dữ liệu cũ không có timestamp/updatedAt)
export function getLatestRecordDate(records = [], vehicleId = null) {
  let latestTime = 0;
  let latestDateStr = '';
  
  if (!Array.isArray(records)) return { latestTime: 0, latestDateStr: '' };

  records.forEach(r => {
    if (!r) return;
    if (vehicleId && r.vehicleId?.toString() !== vehicleId?.toString()) return;
    
    if (r.updatedAt) {
      const t = new Date(r.updatedAt).getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
        latestDateStr = r.updatedAt;
      }
    }
    if (r.date) {
      const t = new Date(r.date + 'T23:59:59').getTime();
      if (!isNaN(t) && t > latestTime) {
        latestTime = t;
        latestDateStr = r.date;
      }
    }
  });

  return { latestTime, latestDateStr };
}

// Ước tính mốc thời gian gần nhất của một gói dữ liệu backup (nếu data.timestamp bị thiếu)
export function getEstimatedBackupTimestamp(data) {
  if (!data) return 0;
  if (data.timestamp) {
    const t = new Date(data.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const refuelLatest = getLatestRecordDate(data.refuelings);
  const expenseLatest = getLatestRecordDate(data.expenses);
  return Math.max(refuelLatest.latestTime, expenseLatest.latestTime);
}

// Đối chiếu chênh lệch danh sách phương tiện 2 chiều giữa Local và Cloud kèm gợi ý thông minh
export function inspectSyncDiscrepancies(cloudData, localVehicles = [], localRefuelings = [], localExpenses = []) {
  if (!cloudData || !Array.isArray(cloudData.vehicles)) {
    return [];
  }

  const cloudVehicles = cloudData.vehicles;
  const explicitCloudTime = cloudData.timestamp ? new Date(cloudData.timestamp).getTime() : 0;
  const estimatedCloudTime = (explicitCloudTime && !isNaN(explicitCloudTime)) ? explicitCloudTime : getEstimatedBackupTimestamp(cloudData);
  const cloudTimestamp = estimatedCloudTime;
  const hasExplicitCloudTimestamp = !!(explicitCloudTime && !isNaN(explicitCloudTime) && explicitCloudTime > 0);

  const deletedVehicles = getDeletedVehicles();
  const hasEverSynced = !!localStorage.getItem('google_drive_last_synced');

  const discrepancies = [];

  // 1. Kiểm tra Chiều A: Xe có trên Cloud nhưng KHÔNG có ở Local (Missing on Local)
  cloudVehicles.forEach(cv => {
    if (!cv) return;
    const normCloudPlate = normalizePlate(cv.plateNumber);
    const existsLocally = localVehicles.some(lv => {
      const normLocalPlate = normalizePlate(lv.plateNumber);
      return (normCloudPlate && normLocalPlate === normCloudPlate) ||
             (lv.id && cv.id && lv.id.toString() === cv.id.toString());
    });

    if (!existsLocally) {
      // Tìm xem xe này có trong danh sách vừa xóa tại Local không
      const deletedRecord = deletedVehicles.find(dv => {
        const normDelPlate = normalizePlate(dv.plateNumber);
        return (normCloudPlate && normDelPlate === normCloudPlate) ||
               (dv.id && cv.id && dv.id.toString() === cv.id.toString());
      });

      const cloudRefuelings = (cloudData.refuelings || []).filter(r => r.vehicleId?.toString() === cv.id?.toString());
      const cloudExpenses = (cloudData.expenses || []).filter(e => e.vehicleId?.toString() === cv.id?.toString());
      const cloudRefuelingCount = cloudRefuelings.length;
      const cloudExpenseCount = cloudExpenses.length;

      let suggestedAction = 'restore_local';
      let suggestedReason = 'Xe có trên Cloud nhưng chưa có tại máy này.';
      let timeDiffText = '';

      if (deletedRecord) {
        const deletedTime = deletedRecord.deletedAt ? new Date(deletedRecord.deletedAt).getTime() : 0;
        
        if (deletedTime && cloudTimestamp && !isNaN(deletedTime)) {
          if (deletedTime >= cloudTimestamp) {
            suggestedAction = 'delete_cloud';
            const cloudTimeStr = hasExplicitCloudTimestamp ? formatSafeTime(cloudData.timestamp) : 'mốc Cloud';
            suggestedReason = `Bạn vừa xóa xe này trên máy (${formatSafeTime(deletedRecord.deletedAt)}) sau ${cloudTimeStr}.`;
            timeDiffText = `Đã xóa trên máy lúc ${formatSafeDateTime(deletedRecord.deletedAt)}`;
          } else {
            suggestedAction = 'restore_local';
            const cloudTimeStr = hasExplicitCloudTimestamp ? formatSafeDateTime(cloudData.timestamp) : 'mới hơn';
            suggestedReason = `Bản sao lưu trên Cloud (${cloudTimeStr}) có cập nhật mới hơn mốc bạn xóa xe.`;
            timeDiffText = hasExplicitCloudTimestamp 
              ? `Cloud cập nhật lúc ${formatSafeDateTime(cloudData.timestamp)}`
              : 'Cloud có cập nhật mới hơn';
          }
        } else {
          // Trường hợp dữ liệu cũ: xe đã xóa trên máy nhưng thiếu mốc giờ so sánh
          // Quyết định an toàn: người dùng đã chủ động xóa trên máy này -> Gợi ý xóa trên Cloud
          suggestedAction = 'delete_cloud';
          suggestedReason = 'Xe đã từng bị xóa trên máy này trước đó (bản ghi cũ). Gợi ý xóa đồng bộ khỏi Cloud.';
          timeDiffText = deletedRecord.deletedAt 
            ? `Đã xóa trên máy lúc ${formatSafeDateTime(deletedRecord.deletedAt)}` 
            : 'Đã xóa trên thiết bị này (trước v1.3.3)';
        }
      } else {
        // Xe có trên Cloud, chưa từng bị xóa tại máy này
        suggestedAction = 'restore_local';
        suggestedReason = 'Xe có trên Cloud nhưng chưa có tại thiết bị này. Gợi ý tải về để bảo toàn dữ liệu.';
        if (hasExplicitCloudTimestamp) {
          timeDiffText = `Lưu trên Cloud lúc ${formatSafeDateTime(cloudData.timestamp)}`;
        } else {
          const { latestDateStr } = getLatestRecordDate([...cloudRefuelings, ...cloudExpenses]);
          timeDiffText = latestDateStr 
            ? `Dữ liệu Cloud cũ (Gần nhất: ${latestDateStr})` 
            : 'Dữ liệu có sẵn trên Cloud (phiên bản cũ)';
        }
      }

      discrepancies.push({
        id: cv.id,
        name: cv.name,
        plateNumber: cv.plateNumber,
        type: cv.type || 'Motorcycle',
        tankCapacity: cv.tankCapacity,
        direction: 'cloud_only', // Có trên Cloud, thiếu ở Local
        cloudRefuelingCount,
        cloudExpenseCount,
        localRefuelingCount: 0,
        localExpenseCount: 0,
        wasDeletedLocally: !!deletedRecord,
        deletedAt: deletedRecord?.deletedAt || null,
        cloudTimestamp: cloudData.timestamp || null,
        timeDiffText,
        suggestedAction,
        suggestedReason,
        selectedAction: suggestedAction
      });
    }
  });

  // 2. Kiểm tra Chiều B: Xe có ở Local nhưng KHÔNG có trên Cloud (Missing on Cloud)
  if (cloudVehicles.length > 0 || cloudData.timestamp) {
    localVehicles.forEach(lv => {
      if (!lv) return;
      const normLocalPlate = normalizePlate(lv.plateNumber);
      const existsOnCloud = cloudVehicles.some(cv => {
        const normCloudPlate = normalizePlate(cv.plateNumber);
        return (normLocalPlate && normCloudPlate === normLocalPlate) ||
               (lv.id && cv.id && lv.id.toString() === cv.id.toString());
      });

      if (!existsOnCloud) {
        const matchingRefuelings = localRefuelings.filter(r => r.vehicleId?.toString() === lv.id?.toString());
        const matchingExpenses = localExpenses.filter(e => e.vehicleId?.toString() === lv.id?.toString());
        const localRefuelingCount = matchingRefuelings.length;
        const localExpenseCount = matchingExpenses.length;

        const localTime = lv.updatedAt ? new Date(lv.updatedAt).getTime() : 0;
        const hasLocalUpdatedAt = !!(lv.updatedAt && !isNaN(localTime) && localTime > 0);

        let suggestedAction = 'upload_cloud';
        let suggestedReason = 'Xe trên thiết bị chưa có trên Cloud.';
        let timeDiffText = '';

        if (hasLocalUpdatedAt) {
          // Xe có timestamp cụ thể
          if (hasEverSynced && cloudTimestamp && localTime < cloudTimestamp) {
            // Thiết bị này đã từng sync, xe được tạo trước mốc Cloud mới nhất -> Đã bị xóa trên Cloud từ máy khác
            suggestedAction = 'delete_local';
            const cloudTimeStr = hasExplicitCloudTimestamp ? formatSafeTime(cloudData.timestamp) : 'mới hơn';
            suggestedReason = `Xe đã bị xóa khỏi Cloud từ thiết bị khác (${cloudTimeStr}).`;
            timeDiffText = hasExplicitCloudTimestamp 
              ? `Cloud cập nhật mới hơn (${formatSafeDateTime(cloudData.timestamp)})` 
              : 'Cloud có cập nhật mới hơn';
          } else {
            suggestedAction = 'upload_cloud';
            suggestedReason = `Xe được tạo/cập nhật trên máy lúc ${formatSafeTime(lv.updatedAt)} (mới hơn Cloud).`;
            timeDiffText = `Tạo/sửa trên máy lúc ${formatSafeDateTime(lv.updatedAt)}`;
          }
        } else {
          // DỮ LIỆU CŨ: Xe trên máy tạo từ các phiên bản trước (chưa có trường updatedAt)
          // NGUYÊN TẮC BẢO TOÀN DỮ LIỆU: Tuyệt đối KHÔNG tự động gợi ý delete_local với data cũ!
          suggestedAction = 'upload_cloud';
          const { latestDateStr } = getLatestRecordDate([...matchingRefuelings, ...matchingExpenses]);
          suggestedReason = 'Dữ liệu xe sẵn có trên thiết bị (phiên bản trước chưa có tem giờ). Gợi ý giữ lại và tải lên Cloud.';
          timeDiffText = latestDateStr 
            ? `Dữ liệu trên máy (Gần nhất: ${latestDateStr})` 
            : 'Dữ liệu trên thiết bị hiện tại (trước v1.3.3)';
        }

        discrepancies.push({
          id: lv.id,
          name: lv.name,
          plateNumber: lv.plateNumber,
          type: lv.type || 'Motorcycle',
          tankCapacity: lv.tankCapacity,
          direction: 'local_only', // Có ở Local, thiếu trên Cloud
          cloudRefuelingCount: 0,
          cloudExpenseCount: 0,
          localRefuelingCount,
          localExpenseCount,
          wasDeletedLocally: false,
          deletedAt: null,
          localUpdatedAt: lv.updatedAt || null,
          cloudTimestamp: cloudData.timestamp || null,
          timeDiffText,
          suggestedAction,
          suggestedReason,
          selectedAction: suggestedAction
        });
      }
    });
  }

  return discrepancies;
}

// Thực thi hợp nhất dữ liệu thông minh theo các quyết định đối soát của người dùng
export async function executeSmartMergeWithDecisions(cloudData, localData, decisions = []) {
  let workingCloudData = cloudData ? JSON.parse(JSON.stringify(cloudData)) : { version: 1, timestamp: new Date().toISOString(), vehicles: [], refuelings: [], expenses: [] };
  let workingLocalVehicles = [...localData.vehicles];
  let workingLocalRefuelings = [...localData.refuelings];
  let workingLocalExpenses = [...localData.expenses];

  decisions.forEach(d => {
    const normPlate = normalizePlate(d.plateNumber);
    const matchesVehicle = (v) => {
      if (!v) return false;
      if (d.id && v.id && v.id.toString() === d.id.toString()) return true;
      if (normPlate && normalizePlate(v.plateNumber) === normPlate) return true;
      return false;
    };

    if (d.selectedAction === 'delete_cloud') {
      // 1. Tìm các xe trên Cloud khớp để lấy ID
      const matchedCloudVehicles = (workingCloudData.vehicles || []).filter(matchesVehicle);
      const matchedCloudIds = new Set(matchedCloudVehicles.map(v => v.id?.toString()));

      // Loại bỏ xe khỏi Cloud
      workingCloudData.vehicles = (workingCloudData.vehicles || []).filter(v => !matchesVehicle(v));
      // Loại bỏ refuelings và expenses tương ứng khỏi Cloud
      workingCloudData.refuelings = (workingCloudData.refuelings || []).filter(r => !matchedCloudIds.has(r.vehicleId?.toString()));
      workingCloudData.expenses = (workingCloudData.expenses || []).filter(e => !matchedCloudIds.has(e.vehicleId?.toString()));

      // Dọn dẹp khỏi danh sách theo dõi xe đã xóa
      removeDeletedVehicle(d.id || d.plateNumber);
    } 
    else if (d.selectedAction === 'restore_local') {
      // Giữ lại trên Cloud để merge vào Local, dọn dẹp khỏi danh sách xe đã xóa
      removeDeletedVehicle(d.id || d.plateNumber);
    }
    else if (d.selectedAction === 'delete_local') {
      // 2. Tìm các xe trên Local khớp để loại bỏ khỏi Local merge
      const matchedLocalVehicles = workingLocalVehicles.filter(matchesVehicle);
      const matchedLocalIds = new Set(matchedLocalVehicles.map(v => v.id?.toString()));

      workingLocalVehicles = workingLocalVehicles.filter(v => !matchesVehicle(v));
      workingLocalRefuelings = workingLocalRefuelings.filter(r => !matchedLocalIds.has(r.vehicleId?.toString()));
      workingLocalExpenses = workingLocalExpenses.filter(e => !matchedLocalIds.has(e.vehicleId?.toString()));

      removeDeletedVehicle(d.id || d.plateNumber);
    }
    else if (d.selectedAction === 'upload_cloud') {
      // Xe local sẽ được merge lên Cloud bình thường
      removeDeletedVehicle(d.id || d.plateNumber);
    }
  });

  // Hợp nhất dữ liệu sau khi đã xử lý các quyết định
  const { vehicles: mergedVehicles, vehicleIdRemap } = mergeVehicles(workingLocalVehicles, workingCloudData.vehicles || []);
  const mergedRefuelings = mergeRefuelings(workingLocalRefuelings, workingCloudData.refuelings || [], vehicleIdRemap);
  const mergedExpenses = mergeExpenses(workingLocalExpenses, workingCloudData.expenses || [], vehicleIdRemap);

  const nowIso = new Date().toISOString();
  const mergedPayload = {
    version: 1,
    timestamp: nowIso,
    vehicles: mergedVehicles.map(v => ({
      ...v,
      updatedAt: v.updatedAt || nowIso
    })),
    refuelings: mergedRefuelings,
    expenses: mergedExpenses
  };

  // Cập nhật Local Dexie DB
  await importToDB(mergedPayload);

  // Đẩy lên Google Drive AppData
  await googleDriveService.backup(mergedPayload);

  const syncTime = mergedPayload.timestamp;
  localStorage.setItem('google_drive_last_synced', syncTime);
  localStorage.setItem('google_drive_last_synced_cloud_timestamp', syncTime);
  localStorage.removeItem('google_drive_unsynced_changes');

  window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: syncTime }));
  window.dispatchEvent(new CustomEvent('unsynced-changes-updated'));

  return {
    vehiclesCount: mergedVehicles.length,
    refuelingsCount: mergedRefuelings.length,
    expensesCount: mergedExpenses.length,
    timestamp: syncTime
  };
}

// Thêm các phương thức khảo sát và thực thi vào googleDriveService
googleDriveService.inspectDiscrepancies = async function() {
  const token = await this.ensureValidToken();
  if (!token) throw new Error('Chưa đăng nhập Google');

  let cloudData = null;
  try {
    cloudData = await this.restore();
  } catch (e) {
    console.log('Chưa có file backup trên Cloud hoặc lỗi tải:', e.message);
  }

  const localVehicles = await db.vehicles.toArray();
  const localRefuelings = await db.refuelings.toArray();
  const localExpenses = await db.expenses.toArray();

  const discrepancies = inspectSyncDiscrepancies(cloudData, localVehicles, localRefuelings, localExpenses);

  return {
    cloudData,
    localData: {
      vehicles: localVehicles,
      refuelings: localRefuelings,
      expenses: localExpenses
    },
    discrepancies
  };
};

googleDriveService.executeMergeWithDecisions = async function(cloudData, localData, decisions = []) {
  const token = await this.ensureValidToken();
  if (!token) throw new Error('Chưa đăng nhập Google');

  window.dispatchEvent(new CustomEvent('google-drive-sync-start'));

  try {
    return await executeSmartMergeWithDecisions(cloudData, localData, decisions);
  } catch (err) {
    console.error('Smart backup error:', err);
    window.dispatchEvent(new CustomEvent('google-drive-sync-error', { detail: err.message }));
    throw err;
  }
};

googleDriveService.smartBackupAndMerge = async function() {
  const check = await this.inspectDiscrepancies();
  return await this.executeMergeWithDecisions(check.cloudData, check.localData, []);
};


