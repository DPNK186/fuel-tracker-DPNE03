const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export const googleDriveService = {
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
      const errData = await searchResponse.json().catch(() => ({}));
      const errMsg = errData.error?.message || searchResponse.statusText || 'Lỗi không xác định';
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
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText || 'Lỗi không xác định';
        throw new Error(`Cập nhật file sao lưu thất bại: ${errMsg}`);
      }
      return await response.json();
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
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText || 'Lỗi không xác định';
        throw new Error(`Tạo file sao lưu mới thất bại: ${errMsg}`);
      }
      return await response.json();
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
      const errData = await searchResponse.json().catch(() => ({}));
      const errMsg = errData.error?.message || searchResponse.statusText || 'Lỗi không xác định';
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
      const errData = await downloadResponse.json().catch(() => ({}));
      const errMsg = errData.error?.message || downloadResponse.statusText || 'Lỗi không xác định';
      throw new Error(`Tải file sao lưu thất bại: ${errMsg}`);
    }
    
    return await downloadResponse.json();
  }
};
