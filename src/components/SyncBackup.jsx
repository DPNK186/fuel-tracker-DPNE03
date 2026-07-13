import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../services/googleDrive';
import { db } from '../db/db';
import { Cloud, CloudLightning, RefreshCw, LogIn, LogOut, Download, Upload, ShieldAlert, CheckCircle } from 'lucide-react';

export default function SyncBackup() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // info, success, error

  useEffect(() => {
    // Kích hoạt việc lấy token từ URL hash nếu có
    googleDriveService.getAccessToken();
    setIsConnected(googleDriveService.isConnected());
  }, []);

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

  // Thực hiện ghi dữ liệu đã restore vào Dexie
  const importToDB = async (data) => {
    if (!data.vehicles || !data.refuelings || !data.expenses) {
      throw new Error('Định dạng dữ liệu không hợp lệ');
    }

    // Xóa dữ liệu cũ
    await db.transaction('rw', db.vehicles, db.refuelings, db.expenses, async () => {
      await db.vehicles.clear();
      await db.refuelings.clear();
      await db.expenses.clear();

      // Thêm dữ liệu mới
      await db.vehicles.bulkAdd(data.vehicles);
      await db.refuelings.bulkAdd(data.refuelings);
      await db.expenses.bulkAdd(data.expenses);
    });
  };

  // Sao lưu lên Google Drive
  const handleCloudBackup = async () => {
    setLoading(true);
    showStatus('Đang nén dữ liệu và tải lên...', 'info');
    try {
      const data = await getDBData();
      await googleDriveService.backup(data);
      showStatus('Sao lưu lên Google Drive thành công!', 'success');
    } catch (err) {
      console.error(err);
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
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('Hành động này sẽ Ghi đè toàn bộ dữ liệu hiện có bằng dữ liệu trong file. Tiếp tục?')) {
      return;
    }

    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        await importToDB(parsedData);
        showStatus('Đã khôi phục dữ liệu từ file JSON thành công!', 'success');
      } catch (err) {
        showStatus('Lọc file thất bại: Định dạng JSON sai hoặc lỗi.', 'error');
      }
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
