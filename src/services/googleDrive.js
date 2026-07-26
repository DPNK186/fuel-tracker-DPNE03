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
      db.vehicles.bulkAdd(data.vehicles),
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

      const mergedObj = {
        ...canonicalVehicle,
        ...v,
        id: canonicalId,
        name: canonicalVehicle.name || v.name,
        plateNumber: canonicalVehicle.plateNumber || v.plateNumber,
        tankCapacity: canonicalVehicle.tankCapacity || v.tankCapacity
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

  // Đảm bảo lấy được Access Token hợp lệ, tự động refresh ngầm nếu đã hết hạn
  async ensureValidToken() {
    const token = this.getAccessToken();
    if (token) return token;

    // Nếu không có token hợp lệ nhưng cờ logged_in vẫn là true, thử làm mới ngầm
    if (localStorage.getItem('google_logged_in') === 'true') {
      const success = await this.refreshTokenSilently();
      if (success) {
        return localStorage.getItem('google_access_token');
      }
    }
    return null;
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
  },

  // Đồng bộ & Hợp nhất dữ liệu thông minh theo yêu cầu (On-Demand Smart Backup & Merge)
  async smartBackupAndMerge() {
    const token = await this.ensureValidToken();
    if (!token) throw new Error('Chưa đăng nhập Google');

    window.dispatchEvent(new CustomEvent('google-drive-sync-start'));

    try {
      // 1. Tải bản sao lưu hiện tại trên Cloud về (nếu có)
      let cloudData = null;
      try {
        cloudData = await this.restore();
      } catch (e) {
        console.log('Chưa có file backup trên Cloud hoặc lỗi tải:', e.message);
      }

      // 2. Thu thập dữ liệu Local hiện tại từ Dexie DB
      const localVehicles = await db.vehicles.toArray();
      const localRefuelings = await db.refuelings.toArray();
      const localExpenses = await db.expenses.toArray();

      // 3. Thực hiện Hợp nhất dữ liệu thông minh (Smart Merge)
      const { vehicles: mergedVehicles, vehicleIdRemap } = mergeVehicles(localVehicles, cloudData?.vehicles || []);
      const mergedRefuelings = mergeRefuelings(localRefuelings, cloudData?.refuelings || [], vehicleIdRemap);
      const mergedExpenses = mergeExpenses(localExpenses, cloudData?.expenses || [], vehicleIdRemap);

      const mergedPayload = {
        version: 1,
        timestamp: new Date().toISOString(),
        vehicles: mergedVehicles,
        refuelings: mergedRefuelings,
        expenses: mergedExpenses
      };

      // 4. Cập nhật dữ liệu đã hợp nhất cho Local Dexie DB
      await importToDB(mergedPayload);

      // 5. Lưu dữ liệu đã hợp nhất lên Google Drive AppData
      await this.backup(mergedPayload);

      const syncTime = mergedPayload.timestamp;
      localStorage.setItem('google_drive_last_synced', syncTime);
      localStorage.setItem('google_drive_last_synced_cloud_timestamp', syncTime);
      localStorage.setItem('google_drive_unsynced_changes', 'false');

      window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: syncTime }));

      return {
        vehiclesCount: mergedVehicles.length,
        refuelingsCount: mergedRefuelings.length,
        expensesCount: mergedExpenses.length,
        timestamp: syncTime
      };
    } catch (err) {
      console.error('Smart backup error:', err);
      window.dispatchEvent(new CustomEvent('google-drive-sync-error', { detail: err.message }));
      throw err;
    }
  }
};

