import React, { useState, useEffect } from 'react';
import { googleDriveService, importToDB } from '../services/googleDrive';
import { db } from '../db/db';
import { Cloud, CloudLightning, RefreshCw, LogIn, LogOut, Download, Upload, ShieldAlert, CheckCircle } from 'lucide-react';

export default function SyncBackup() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // info, success, error
  const [lastSynced, setLastSynced] = useState(localStorage.getItem('google_drive_last_synced') || null);

  useEffect(() => {
    // Kích hoạt việc lấy/làm mới token nếu đã từng đăng nhập
    if (googleDriveService.isConnected()) {
      setIsConnected(true);
      googleDriveService.refreshTokenSilently().then(success => {
        setIsConnected(success);
      });
    } else {
      setIsConnected(false);
    }

    const handleLoginSuccessEvent = () => {
      setIsConnected(true);
    };

    const handleLogoutEvent = () => {
      setIsConnected(false);
      setLastSynced(null);
    };

    const handleSyncSuccessEvent = () => {
      setLastSynced(localStorage.getItem('google_drive_last_synced') || null);
    };

    window.addEventListener('google-drive-login-success', handleLoginSuccessEvent);
    window.addEventListener('google-drive-logout', handleLogoutEvent);
    window.addEventListener('google-drive-sync-success', handleSyncSuccessEvent);
    return () => {
      window.removeEventListener('google-drive-login-success', handleLoginSuccessEvent);
      window.removeEventListener('google-drive-logout', handleLogoutEvent);
      window.removeEventListener('google-drive-sync-success', handleSyncSuccessEvent);
    };
  }, []);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Chưa từng đồng bộ';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Chưa từng đồng bộ';
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return 'Chưa từng đồng bộ';
    }
  };

  const handleLogin = () => {
    googleDriveService.login();
  };

  const handleLogout = () => {
    googleDriveService.logout();
    setIsConnected(false);
    showStatus('Đã đăng xuất tài khoản Google.', 'info');
  };

  const showStatus = (msg, type = 'info') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
    }, 6000);
  };

  // Thực hiện lấy tất cả dữ liệu từ Dexie DB
  const getDBData = async () => {
    const vehicles = await db.vehicles.toArray();
    const refuelings = await db.refuelings.toArray();
    const expenses = await db.expenses.toArray();
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      vehicles,
      refuelings,
      expenses
    };
  };

  // Sao lưu lên Google Drive
  const handleCloudBackup = async () => {
    setLoading(true);
    showStatus('Đang nén dữ liệu và tải lên...', 'info');
    window.dispatchEvent(new CustomEvent('google-drive-sync-start'));
    try {
      const data = await getDBData();
      await googleDriveService.backup(data);
      const syncTime = new Date().toISOString();
      localStorage.setItem('google_drive_last_synced', syncTime);
      setLastSynced(syncTime);
      window.dispatchEvent(new CustomEvent('google-drive-sync-success', { detail: syncTime }));
      showStatus('Sao lưu lên Google Drive thành công!', 'success');
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('google-drive-sync-error', { detail: err.message }));
      showStatus('Sao lưu thất bại: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Phục hồi từ Google Drive
  const handleCloudRestore = async () => {
    if (!confirm('Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại tại thiết bị cục bộ của bạn. Bạn có muốn tiếp tục?')) {
      return;
    }
    
    setLoading(true);
    showStatus('Đang tải dữ liệu từ Google Drive...', 'info');
    try {
      const data = await googleDriveService.restore();
      await importToDB(data);
      showStatus('Khôi phục dữ liệu thành công! Ứng dụng đã cập nhật.', 'success');
    } catch (err) {
      console.error(err);
      showStatus('Khôi phục thất bại: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export dữ liệu ra file JSON cục bộ (Offline Backup)
  const handleLocalExport = async () => {
    try {
      const data = await getDBData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `fuel_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showStatus('Đã xuất file sao lưu JSON thành công!', 'success');
    } catch (err) {
      showStatus('Lỗi xuất file: ' + err.message, 'error');
    }
  };

  // Import dữ liệu từ file JSON cục bộ
  const handleLocalImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Bộ lọc định dạng file JSON
    const isJson = file.type === 'application/json' || file.name.endsWith('.json');
    if (!isJson) {
      showStatus('Chỉ chấp nhận tệp tin định dạng JSON (.json)', 'error');
      e.target.value = '';
      return;
    }

    if (!confirm('Hành động này sẽ Ghi đè toàn bộ dữ liệu hiện có bằng dữ liệu trong file. Tiếp tục?')) {
      e.target.value = '';
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        await importToDB(parsedData);
        showStatus('Đã khôi phục dữ liệu từ file JSON thành công!', 'success');
        // Tự động đồng bộ lên Drive ngầm sau khi import local
        googleDriveService.autoBackup();
      } catch (err) {
        showStatus('Khôi phục thất bại: ' + err.message, 'error');
      } finally {
        // 2. Giải phóng bộ nhớ input file
        e.target.value = '';
      }
    };

    fileReader.onerror = () => {
      showStatus('Không thể đọc tệp tin này.', 'error');
      e.target.value = '';
    };

    fileReader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      {/* Cloud Sync Panel */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Cloud className="text-brand-500 w-6 h-6" />
          Sao lưu Google Drive
        </h2>

        {statusMessage && (
          <div className={`p-4 rounded-xl mb-4 flex items-center gap-3 text-sm animate-fade-in ${
            statusType === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
            statusType === 'error' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
            'bg-sky-500/10 border border-sky-500/20 text-sky-400'
          }`}>
            {statusType === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {statusType === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
            {statusType === 'info' && <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-center mb-6">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-brand-500/10 p-4 rounded-full border border-brand-500/20 text-brand-400 animate-pulse">
                  <Cloud className="w-12 h-12" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-200">Đã kết nối Google Drive</p>
                <p className="text-xs text-slate-500 mt-1">Dữ liệu được lưu an toàn trong thư mục AppData riêng tư</p>
                <p className="text-xs text-brand-400 mt-2 bg-brand-500/5 py-1 px-3 rounded-lg border border-brand-500/10 inline-block font-medium">
                  Đồng bộ lần cuối: {formatDateTime(lastSynced)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 px-3 py-1.5 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất tài khoản
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-slate-800 p-4 rounded-full text-slate-500">
                  <CloudLightning className="w-12 h-12" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-300">Chưa kết nối đám mây</p>
                <p className="text-xs text-slate-500 mt-1">Kết nối tài khoản Google để tự động sao lưu an toàn khi có mạng</p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-slate-100 hover:bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-150"
              >
                <LogIn className="w-5 h-5" />
                Đăng nhập với Google
              </button>
              <div className="bg-slate-900/80 border border-dashed border-slate-800 rounded-2xl p-4 text-left space-y-2 mt-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  📌 <strong className="text-slate-300">Lưu ý dành cho thành viên mới:</strong> Do ứng dụng đang trong giai đoạn vận hành nội bộ, nếu bạn gặp lỗi chặn đăng nhập từ Google (Error 403: access_denied), vui lòng gửi địa chỉ Gmail của bạn tới Quản trị viên ĐPNE03 qua mail để được duyệt cấp quyền kết nối hệ thống.
                </p>
                <div className="text-right">
                  <a
                    href="mailto:dpn.e103a@gmail.com?subject=Yêu cầu cấp quyền Sync ứng dụng Xăng Xe"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition"
                  >
                    <span>Gửi Email đăng ký</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCloudBackup}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-brand-500/10"
            >
              <Upload className="w-4 h-4" />
              Sao lưu lên đám mây
            </button>
            <button
              onClick={handleCloudRestore}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              Khôi phục từ đám mây
            </button>
          </div>
        )}
      </div>

      {/* Offline Backup Panel */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Download className="text-brand-500 w-6 h-6" />
          Sao lưu thủ công (Offline)
        </h2>
        
        <p className="text-xs text-slate-400 mb-6">
          Bạn có thể xuất toàn bộ dữ liệu ra một file `.json` để lưu trữ thủ công hoặc import ngược lại vào ứng dụng mà không cần tài khoản mạng.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleLocalExport}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            Tải file dữ liệu JSON (.json)
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              id="local-import"
              onChange={handleLocalImport}
              className="hidden"
            />
            <label
              htmlFor="local-import"
              className="w-full bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition hover:bg-slate-900/80 text-center"
            >
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-300">Khôi phục từ file JSON</span>
              <span className="text-xs text-slate-500">Nhấp để chọn file sao lưu từ máy của bạn</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
