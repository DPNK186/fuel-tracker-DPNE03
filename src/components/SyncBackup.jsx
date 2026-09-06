import React, { useState, useEffect } from 'react';
import { googleDriveService, importToDB, normalizePlate } from '../services/googleDrive';
import { db } from '../db/db';
import { 
  Cloud, 
  CloudLightning, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  Download, 
  Upload, 
  ShieldAlert, 
  CheckCircle, 
  Info,
  AlertTriangle,
  Sparkles,
  Trash2,
  Car,
  Bike,
  X
} from 'lucide-react';

export default function SyncBackup() {
  const [isConnected, setIsConnected] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // info, success, error
  const [lastSynced, setLastSynced] = useState(localStorage.getItem('google_drive_last_synced') || null);

  // State quản lý Modal Đối Soát Phương Tiện 2 Chiều
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [pendingSyncData, setPendingSyncData] = useState(null); // { cloudData, localData, discrepancies }
  const [discrepancyDecisions, setDiscrepancyDecisions] = useState({}); // { [vehicleKey]: 'delete_cloud' | 'restore_local' | 'delete_local' | 'upload_cloud' }

  useEffect(() => {
    // Kiểm tra trạng thái kết nối và token trong bộ nhớ
    if (googleDriveService.isConnected()) {
      setIsConnected(true);
      const activeToken = googleDriveService.getAccessToken();
      setReauthRequired(!activeToken);
    } else {
      setIsConnected(false);
      setReauthRequired(false);
    }

    const handleLoginSuccessEvent = () => {
      setIsConnected(true);
      setReauthRequired(false);
    };

    const handleLogoutEvent = () => {
      setIsConnected(false);
      setReauthRequired(false);
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

  // Hàm trợ giúp bọc tác vụ yêu cầu Token, tự động mở popup đăng nhập lại nếu hết hạn
  const executeWithToken = async (actionFn) => {
    const token = googleDriveService.getAccessToken();
    if (token) {
      setLoading(true);
      try {
        await actionFn();
      } catch (err) {
        console.error(err);
        showStatus('Thất bại: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      showStatus('Phiên đăng nhập hết hạn, vui lòng Đăng nhập lại.', 'info');
      setReauthRequired(true);

      const handleSuccess = async () => {
        window.removeEventListener('google-drive-login-success', handleSuccess);
        try {
          setLoading(true);
          showStatus('Đang thực hiện tác vụ...', 'info');
          await actionFn();
        } catch (err) {
          console.error(err);
          showStatus('Thất bại: ' + err.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      window.addEventListener('google-drive-login-success', handleSuccess);

      googleDriveService.login();
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

  // Sao lưu và Hợp nhất thông minh lên Google Drive (có đối soát chênh lệch 2 chiều)
  const handleCloudSmartBackup = () => {
    executeWithToken(async () => {
      showStatus('Đang đối chiếu dữ liệu với Google Drive...', 'info');
      const checkResult = await googleDriveService.inspectDiscrepancies();

      if (checkResult.discrepancies && checkResult.discrepancies.length > 0) {
        setPendingSyncData(checkResult);
        const initialDecisions = {};
        checkResult.discrepancies.forEach(d => {
          const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
          initialDecisions[key] = d.suggestedAction;
        });
        setDiscrepancyDecisions(initialDecisions);
        setShowDiscrepancyModal(true);
        setStatusMessage('');
        return;
      }

      showStatus('Đang hợp nhất và sao lưu...', 'info');
      const result = await googleDriveService.executeMergeWithDecisions(checkResult.cloudData, checkResult.localData, []);
      const syncTime = result.timestamp;
      setLastSynced(syncTime);
      showStatus(`Đã hợp nhất & sao lưu thành công! (${result.vehiclesCount} xe, ${result.refuelingsCount} lần đổ xăng, ${result.expensesCount} chi phí)`, 'success');
    });
  };

  // Phục hồi từ Google Drive (có đối soát chênh lệch 2 chiều)
  const handleCloudRestore = () => {
    if (!confirm('Hành động này sẽ tải lại bản sao lưu từ Google Drive và hợp nhất với dữ liệu thiết bị của bạn. Tiếp tục?')) {
      return;
    }

    executeWithToken(async () => {
      showStatus('Đang tải và đối chiếu dữ liệu từ Google Drive...', 'info');
      const checkResult = await googleDriveService.inspectDiscrepancies();

      if (checkResult.discrepancies && checkResult.discrepancies.length > 0) {
        setPendingSyncData(checkResult);
        const initialDecisions = {};
        checkResult.discrepancies.forEach(d => {
          const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
          initialDecisions[key] = d.suggestedAction;
        });
        setDiscrepancyDecisions(initialDecisions);
        setShowDiscrepancyModal(true);
        setStatusMessage('');
        return;
      }

      showStatus('Đang hợp nhất dữ liệu...', 'info');
      const result = await googleDriveService.executeMergeWithDecisions(checkResult.cloudData, checkResult.localData, []);
      setLastSynced(result.timestamp);
      showStatus('Khôi phục & hợp nhất dữ liệu thành công! Ứng dụng đã cập nhật.', 'success');
    });
  };

  // Xác nhận thực thi hợp nhất theo các lựa chọn trong Modal Đối Soát
  const handleConfirmReconciliation = () => {
    if (!pendingSyncData) return;
    executeWithToken(async () => {
      setShowDiscrepancyModal(false);
      showStatus('Đang thực hiện đồng bộ theo lựa chọn của bạn...', 'info');

      const formattedDecisions = pendingSyncData.discrepancies.map(d => {
        const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
        return {
          id: d.id,
          plateNumber: d.plateNumber,
          direction: d.direction,
          selectedAction: discrepancyDecisions[key] || d.suggestedAction
        };
      });

      const result = await googleDriveService.executeMergeWithDecisions(
        pendingSyncData.cloudData,
        pendingSyncData.localData,
        formattedDecisions
      );

      const syncTime = result.timestamp;
      setLastSynced(syncTime);
      setPendingSyncData(null);
      showStatus(`Đã đồng bộ hoàn tất! (${result.vehiclesCount} xe, ${result.refuelingsCount} lần đổ xăng, ${result.expensesCount} chi phí)`, 'success');
    });
  };

  // Thao tác nhanh: Áp dụng toàn bộ gợi ý thông minh
  const handleApplyAllSuggestions = () => {
    if (!pendingSyncData) return;
    const newDecisions = {};
    pendingSyncData.discrepancies.forEach(d => {
      const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
      newDecisions[key] = d.suggestedAction;
    });
    setDiscrepancyDecisions(newDecisions);
  };

  // Thao tác nhanh: Giữ lại tất cả xe (Khôi phục Cloud về Local & Tải Local lên Cloud)
  const handleKeepAllVehicles = () => {
    if (!pendingSyncData) return;
    const newDecisions = {};
    pendingSyncData.discrepancies.forEach(d => {
      const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
      newDecisions[key] = d.direction === 'cloud_only' ? 'restore_local' : 'upload_cloud';
    });
    setDiscrepancyDecisions(newDecisions);
  };

  // Thao tác nhanh: Đồng bộ theo thiết bị này (Chỉ giữ xe đang có ở máy)
  const handleSyncToThisDevice = () => {
    if (!pendingSyncData) return;
    const newDecisions = {};
    pendingSyncData.discrepancies.forEach(d => {
      const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
      newDecisions[key] = d.direction === 'cloud_only' ? 'delete_cloud' : 'upload_cloud';
    });
    setDiscrepancyDecisions(newDecisions);
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
          <div className={`p-4 rounded-xl mb-4 flex items-center gap-3 text-sm animate-fade-in ${statusType === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
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
            reauthRequired ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 text-amber-400 animate-pulse">
                    <CloudLightning className="w-12 h-12" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-amber-400">Phiên đăng nhập đã hết hạn</p>
                  <p className="text-xs text-slate-400 mt-1">Bấm nút bên dưới để Đăng nhập lại và Hợp nhất dữ liệu ngay lập tức</p>
                  {lastSynced && (
                    <p className="text-[11px] text-slate-500 mt-2 bg-slate-950/40 py-1 px-3 rounded-lg border border-slate-800 inline-block font-medium">
                      Đồng bộ lần cuối: {formatDateTime(lastSynced)}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloudSmartBackup}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 shadow-lg shadow-brand-500/10"
                >
                  <LogIn className="w-5 h-5" />
                  Đăng nhập & Hợp nhất Google Drive
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 px-3 py-1.5 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Hủy kết nối tài khoản
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-brand-500/10 p-4 rounded-full border border-brand-500/20 text-brand-400">
                    <Cloud className="w-12 h-12" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Đã kết nối Google Drive</p>
                  <p className="text-xs text-slate-500 mt-1">Sao lưu thủ công & Hợp nhất an toàn vào thư mục riêng tư</p>
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
            )
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-slate-800 p-4 rounded-full text-slate-500">
                  <CloudLightning className="w-12 h-12" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-300">Sao lưu đám mây theo yêu cầu</p>
                <p className="text-xs text-slate-500 mt-1">Kết nối tài khoản Google để sao lưu & hợp nhất dữ liệu khi cần</p>
              </div>
              <button
                onClick={handleCloudSmartBackup}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 shadow-lg shadow-brand-500/10"
              >
                <LogIn className="w-5 h-5" />
                Đăng nhập & Sao lưu ngay
              </button>
              <div className="bg-slate-900/80 border border-dashed border-slate-800 rounded-2xl p-4 text-left space-y-2 mt-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  📌 <strong className="text-slate-300">Lưu ý:</strong> Mặc định toàn bộ dữ liệu luôn được lưu an toàn tại máy của bạn. Khi bấm nút Sao lưu, hệ thống sẽ tự động tải bản sao lưu cũ trên Drive để hợp nhất mà không bao giờ làm mất dữ liệu của bạn.
                </p>
              </div>
            </div>
          )}
        </div>

        {isConnected && !reauthRequired && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCloudSmartBackup}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-brand-500/10"
            >
              <Upload className="w-4 h-4" />
              Sao lưu & Hợp nhất
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

      {/* App Version Info Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 flex flex-col items-center justify-center text-center animate-fade-in space-y-2.5" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Info className="w-4 h-4 text-brand-400" />
          <span>Thông tin ứng dụng</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-slate-500">Phiên bản: </span>
            <span className="text-brand-400 font-semibold font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/10">v1.3.3</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800"></div>
          <div>
            <span className="text-slate-500">Cập nhật: </span>
            <span className="text-slate-300 font-medium">07/09/2026 02:24</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-800/60 w-full mt-1">
          Build by ĐPNE03
        </div>
      </div>

      {/* Modal Đối Soát Chênh Lệch Phương Tiện 2 Chiều */}
      {showDiscrepancyModal && pendingSyncData && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 animate-fade-in border-amber-500/30 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <h3 className="text-base font-bold text-slate-100">Đối chiếu chênh lệch phương tiện</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowDiscrepancyModal(false);
                  setPendingSyncData(null);
                }}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-300 leading-relaxed">
              Phát hiện <span className="font-bold text-amber-400">{pendingSyncData.discrepancies.length}</span> phương tiện có sự khác biệt giữa thiết bị này và bản sao lưu Google Drive. Hệ thống đã phân tích mốc thời gian cập nhật để đưa ra gợi ý xử lý tối ưu:
            </p>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleApplyAllSuggestions}
                className="text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Áp dụng gợi ý
              </button>
              <button
                type="button"
                onClick={handleKeepAllVehicles}
                className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Giữ lại tất cả xe
              </button>
              <button
                type="button"
                onClick={handleSyncToThisDevice}
                className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1"
              >
                Đồng bộ theo máy này
              </button>
            </div>

            {/* Discrepant Vehicles List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pendingSyncData.discrepancies.map((d, idx) => {
                const key = d.id?.toString() || normalizePlate(d.plateNumber) || d.name;
                const currentAction = discrepancyDecisions[key] || d.suggestedAction;

                return (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    {/* Vehicle Header Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {d.type === 'Motorcycle' ? (
                          <Bike className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Car className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-200">{d.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Biển số: <span className="text-slate-300 font-medium">{d.plateNumber || 'Chưa có'}</span>
                            {d.tankCapacity && ` • ${d.tankCapacity}L`}
                          </p>
                        </div>
                      </div>

                      {/* Direction Tag */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                        d.direction === 'cloud_only'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {d.direction === 'cloud_only' ? 'Có trên Cloud • Thiếu ở máy' : 'Có trên máy • Thiếu trên Cloud'}
                      </span>
                    </div>

                    {/* Time & Count subtext */}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                      <span>{d.timeDiffText}</span>
                      <span className="text-slate-300 font-medium">
                        {d.direction === 'cloud_only' 
                          ? `${d.cloudRefuelingCount} đổ xăng, ${d.cloudExpenseCount} chi phí`
                          : `${d.localRefuelingCount} đổ xăng, ${d.localExpenseCount} chi phí`}
                      </span>
                    </div>

                    {/* Auto Recommendation Box */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-xs flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">
                          Gợi ý: {
                            d.suggestedAction === 'delete_cloud' ? 'Nên xóa trên Cloud' :
                            d.suggestedAction === 'restore_local' ? 'Nên khôi phục về máy' :
                            d.suggestedAction === 'delete_local' ? 'Nên xóa trên máy' : 'Nên tải lên Cloud'
                          }
                        </span>
                        <p className="text-[11px] text-slate-300 mt-0.5">{d.suggestedReason}</p>
                      </div>
                    </div>

                    {/* Decision Selector Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {d.direction === 'cloud_only' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setDiscrepancyDecisions(prev => ({ ...prev, [key]: 'delete_cloud' }))}
                            className={`p-2 rounded-xl text-left border text-xs transition active:scale-95 flex items-center gap-2 ${
                              currentAction === 'delete_cloud'
                                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                            <span>Xóa trên Cloud</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscrepancyDecisions(prev => ({ ...prev, [key]: 'restore_local' }))}
                            className={`p-2 rounded-xl text-left border text-xs transition active:scale-95 flex items-center gap-2 ${
                              currentAction === 'restore_local'
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                            <span>Khôi phục về máy</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setDiscrepancyDecisions(prev => ({ ...prev, [key]: 'delete_local' }))}
                            className={`p-2 rounded-xl text-left border text-xs transition active:scale-95 flex items-center gap-2 ${
                              currentAction === 'delete_local'
                                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                            <span>Xóa trên máy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscrepancyDecisions(prev => ({ ...prev, [key]: 'upload_cloud' }))}
                            className={`p-2 rounded-xl text-left border text-xs transition active:scale-95 flex items-center gap-2 ${
                              currentAction === 'upload_cloud'
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                            <span>Tải lên Cloud</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleConfirmReconciliation}
                className="w-full bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition active:scale-95 shadow-lg shadow-brand-500/20"
              >
                Xác nhận & Tiến hành Đồng bộ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscrepancyModal(false);
                  setPendingSyncData(null);
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 rounded-xl text-xs transition active:scale-95"
              >
                Hủy bỏ (Giữ nguyên hiện trạng)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
