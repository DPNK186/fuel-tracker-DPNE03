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

export const googleDriveService = {
  // Timer lưu trữ retry ngầm
  retryTimer: null,

  // Lấy Access Token từ URL hash hoặc localStorage
  getAccessToken() {
    // 1. Kiểm tra trong URL hash (sau khi redirect từ Google OAuth)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in'); // thời gian sống (giây)

      if (accessToken) {
        const expiresAt = new Date().getTime() + parseInt(expiresIn) * 1000;
        localStorage.setItem('google_access_token', accessToken);
        localStorage.setItem('google_token_expires_at', expiresAt.toString());
        
        // Xóa hash trên URL để nhìn sạch sẽ hơn
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        return accessToken;
      }
    }

    // 2. Kiểm tra trong localStorage xem token cũ còn hạn không
    const token = localStorage.getItem('google_access_token');
    const expiresAt = localStorage.getItem('google_token_expires_at');

    if (token && expiresAt) {
      if (new Date().getTime() < parseInt(expiresAt)) {
        return token;
      } else {
        // Hết hạn thì xóa đi
        this.logout();
      }
    }

    return null;
  },

  // Chuyển hướng sang Google OAuth để đăng nhập
  login() {
    if (!CLIENT_ID) {
      alert('Vui lòng cấu hình VITE_GOOGLE_CLIENT_ID trong file .env');
      return;
    }

    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES)}`;
      
    window.location.href = authUrl;
  },

  logout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_drive_last_synced');
    localStorage.removeItem('google_drive_last_synced_cloud_timestamp');
    localStorage.removeItem('google_drive_unsynced_changes');
    window.dispatchEvent(new CustomEvent('google-drive-logout'));
  },

  // Kiểm tra xem đã kết nối tài khoản chưa
  isConnected() {
    return !!this.getAccessToken();
  },

  // Đồng bộ: Sao lưu dữ liệu lên Google Drive AppData
  async backup(data) {
    const token = this.getAccessToken();
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
    const token = this.getAccessToken();
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

  // Đồng bộ chạy ngầm và kiểm tra xung đột phiên bản
  async autoBackup(forceOverwrite = false) {
    if (!this.isConnected()) return;

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    // Báo hiệu bắt đầu đồng bộ
    window.dispatchEvent(new CustomEvent('google-drive-sync-start'));

    try {
      const fileName = 'fuel_tracker_backup.json';
      const token = this.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập Google');

      // 1. Tìm kiếm file backup hiện tại trên Drive để lấy timestamp
      const query = `name='${fileName}' and 'appDataFolder' in parents`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder`;
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let cloudData = null;
      let cloudTimestamp = null;
      let existingFile = null;

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        existingFile = searchResult.files && searchResult.files[0];
        if (existingFile) {
          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`;
          const downloadResponse = await fetch(downloadUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (downloadResponse.ok) {
            try {
              cloudData = await downloadResponse.json();
              cloudTimestamp = cloudData?.timestamp || null;
            } catch (e) {
              console.error('Không thể đọc dữ liệu JSON trên Drive:', e);
            }
          }
        }
      }

      const localLastSyncedCloudTimestamp = localStorage.getItem('google_drive_last_synced_cloud_timestamp');
      const hasUnsyncedChanges = localStorage.getItem('google_drive_unsynced_changes') === 'true';

      // Xử lý trường hợp đăng nhập thiết bị mới (chưa từng đồng bộ thành công trước đó trên thiết bị này)
      if (cloudTimestamp && !localLastSyncedCloudTimestamp) {
        const isEmptyOrSample = await isLocalDBEmptyOrSample();
        if (isEmptyOrSample) {
          // Tự động khôi phục từ Cloud về Local
          await importToDB(cloudData);
          localStorage.setItem('google_drive_last_synced', new Date().toISOString());
          localStorage.setItem('google_drive_last_synced_cloud_timestamp', cloudTimestamp);
          localStorage.removeItem('google_drive_unsynced_changes');
          window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: cloudTimestamp }));
          return;
        } else if (!forceOverwrite) {
          // Local đã có dữ liệu thực của người dùng -> phát sinh xung đột để chọn ghi đè
          window.dispatchEvent(new CustomEvent('google-drive-sync-conflict', {
            detail: {
              localTime: null,
              cloudTime: cloudTimestamp,
              cloudData: cloudData
            }
          }));
          return;
        }
      }

      // Phát hiện xung đột dữ liệu
      if (cloudTimestamp && localLastSyncedCloudTimestamp && cloudTimestamp !== localLastSyncedCloudTimestamp) {
        if (hasUnsyncedChanges && !forceOverwrite) {
          // Xung đột thực tế: Cả thiết bị khác đã ghi đè lên Cloud và Local hiện tại cũng có thay đổi chưa sync
          window.dispatchEvent(new CustomEvent('google-drive-sync-conflict', {
            detail: {
              localTime: localLastSyncedCloudTimestamp,
              cloudTime: cloudTimestamp,
              cloudData: cloudData
            }
          }));
          return;
        } else if (!hasUnsyncedChanges) {
          // Local không có sửa đổi nào mới, tự động khôi phục dữ liệu từ Cloud
          await importToDB(cloudData);
          localStorage.setItem('google_drive_last_synced', new Date().toISOString());
          localStorage.setItem('google_drive_last_synced_cloud_timestamp', cloudTimestamp);
          localStorage.removeItem('google_drive_unsynced_changes');
          window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: cloudTimestamp }));
          return;
        }
      }

      // 2. Thu thập dữ liệu Local và đẩy lên
      const vehicles = await db.vehicles.toArray();
      const refuelings = await db.refuelings.toArray();
      const expenses = await db.expenses.toArray();
      const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        vehicles,
        refuelings,
        expenses
      };

      await this.backup(data);
      window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: data.timestamp }));
    } catch (err) {
      console.error('Auto backup error:', err);
      localStorage.setItem('google_drive_unsynced_changes', 'true');
      window.dispatchEvent(new CustomEvent('google-drive-sync-error', { detail: err.message }));

      // Hẹn giờ thử lại sau 10 giây
      this.retryTimer = setTimeout(() => {
        this.autoBackup(forceOverwrite);
      }, 10000);
    }
  }
};

