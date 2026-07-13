import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import Dashboard from './components/Dashboard';
import RefuelingForm from './components/RefuelingForm';
import ExpenseForm from './components/ExpenseForm';
import SyncBackup from './components/SyncBackup';
import { useRegisterSW } from 'virtual:pwa-register/react'; // Import hook đăng ký SW chủ động
import { 
  LayoutDashboard, 
  Fuel, 
  Wrench, 
  Cloud, 
  Car, 
  Bike, 
  Plus, 
  X, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Điều phối mở rộng form
  const [expandRefuel, setExpandRefuel] = useState(false);
  const [expandExpense, setExpandExpense] = useState(false);

  // Xe
  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const [currentVehicleId, setCurrentVehicleId] = useState(localStorage.getItem('active_vehicle_id') || '');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('Motorcycle');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleTankCapacity, setNewVehicleTankCapacity] = useState('');

  // Chuỗi ID các xe để tối ưu hóa dependencies cho useEffect (chống render lặp vô hạn)
  const vehicleIdsString = useMemo(() => {
    return vehicles ? vehicles.map(v => v.id).join(',') : '';
  }, [vehicles]);

  // Chế độ chỉnh sửa thông tin xe
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  // Các state dành cho gợi ý cài đặt PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Lắng nghe sự kiện cập nhật PWA chủ động qua Service Worker Prompt
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Quản lý trạng thái Online/Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Thiết lập xe hiện hành mặc định khi tải trang
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const isValid = vehicles.some(v => v.id.toString() === currentVehicleId);
      if (!currentVehicleId || !isValid) {
        const defaultId = vehicles[0].id.toString();
        setCurrentVehicleId(defaultId);
        localStorage.setItem('active_vehicle_id', defaultId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleIdsString, currentVehicleId]);

  // Kiểm tra trạng thái Standalone & Snooze 7 ngày của PWA Banner
  useEffect(() => {
    // 1. Kiểm tra xem ứng dụng có đang chạy ở chế độ standalone (đã cài đặt) không
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setShowPwaBanner(false);
      return;
    }

    // 2. Kiểm tra xem người dùng có tắt banner trong vòng 7 ngày qua không
    const dismissedAt = localStorage.getItem('pwa_banner_dismissed_at');
    if (dismissedAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (new Date().getTime() - parseInt(dismissedAt) < sevenDaysInMs) {
        setShowPwaBanner(false);
        return;
      }
    }

    // 3. Kiểm tra xem có phải thiết bị iOS không
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iosCheck);

    // Nếu là iOS, hiển thị banner hướng dẫn thủ công vì không có sự kiện beforeinstallprompt
    if (iosCheck) {
      setShowPwaBanner(true);
    }

    // Lắng nghe sự kiện cài đặt PWA trên Android/Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setShowPwaBanner(false);
      }
      setDeferredPrompt(null);
    });
  };

  const handleDismissPwaBanner = () => {
    setShowPwaBanner(false);
    // Lưu mốc thời gian tắt banner để ẩn trong vòng 7 ngày tiếp theo
    localStorage.setItem('pwa_banner_dismissed_at', new Date().getTime().toString());
  };

  const handleSelectVehicle = (id) => {
    setCurrentVehicleId(id.toString());
    localStorage.setItem('active_vehicle_id', id.toString());
    setShowVehicleModal(false);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setNewVehicleName(vehicle.name);
    setNewVehicleType(vehicle.type);
    setNewVehiclePlate(vehicle.plateNumber || '');
    setNewVehicleTankCapacity(vehicle.tankCapacity ? vehicle.tankCapacity.toString() : '');
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicleName) return;

    const data = {
      name: newVehicleName,
      type: newVehicleType,
      plateNumber: newVehiclePlate,
      tankCapacity: newVehicleTankCapacity ? parseFloat(newVehicleTankCapacity) : null
    };

    try {
      if (editingVehicleId) {
        // Chế độ Chỉnh sửa
        await db.vehicles.update(editingVehicleId, data);
        setEditingVehicleId(null);
      } else {
        // Chế độ Thêm mới (Bọc dọn dẹp và thêm mới trong một Transaction nguyên tử)
        let newId;
        await db.transaction('rw', db.vehicles, db.refuelings, db.expenses, async () => {
          const sampleVehicle = await db.vehicles.where('plateNumber').equals('29A-123.45').first();
          if (sampleVehicle) {
            const sampleId = sampleVehicle.id;
            // Xóa song song dữ liệu mẫu liên kết
            await Promise.all([
              db.vehicles.delete(sampleId),
              db.refuelings.where('vehicleId').equals(sampleId).delete(),
              db.expenses.where('vehicleId').equals(sampleId).delete()
            ]);
          }
          newId = await db.vehicles.add(data);
        });

        if (newId) {
          setCurrentVehicleId(newId.toString());
          localStorage.setItem('active_vehicle_id', newId.toString());
        }
      }

      setNewVehicleName('');
      setNewVehiclePlate('');
      setNewVehicleTankCapacity('');
      setShowVehicleModal(false);
    } catch (err) {
      console.error('Lỗi khi thao tác phương tiện:', err);
      alert('Thao tác phương tiện thất bại: ' + err.message);
    }
  };

  // Xác định thông tin xe hiện tại đang chọn
  const activeVehicle = useMemo(() => {
    if (!vehicles || !currentVehicleId) return null;
    return vehicles.find(v => v.id.toString() === currentVehicleId) || vehicles[0];
  }, [vehicles, currentVehicleId]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto relative shadow-2xl border-x border-slate-900 transition-all duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 rounded-b-2xl transition-all duration-300">
        <div className="flex items-center gap-2.5">
          <img 
            src="/fuel-tracker-DPNE03/Icon1.png" 
            alt="Xăng Xe Logo" 
            className="w-8 h-8 rounded-xl object-cover border border-brand-500/20"
          />
          <div>
            <h1 className="text-md font-extrabold tracking-tight text-white leading-none">Xăng Xe</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Offline-First App</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline Status */}
          <div className="transition-all duration-300">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>

          {/* Manage Vehicle Button */}
          <button 
            onClick={() => setShowVehicleModal(true)}
            className="bg-slate-900 hover:bg-slate-800 py-1.5 px-3 rounded-xl text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5 text-xs font-bold shadow-md shadow-black/30 active:scale-95"
            title="Thay đổi / Quản lý phương tiện"
          >
            {activeVehicle?.type === 'Motorcycle' ? (
              <Bike className="w-4 h-4 text-emerald-400" />
            ) : (
              <Car className="w-4 h-4 text-sky-400" />
            )}
            <span className="max-w-[80px] truncate">{activeVehicle?.name || 'Chọn xe'}</span>
          </button>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 px-4 py-5 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <Dashboard 
            currentVehicleId={currentVehicleId}
            onQuickAction={(tab, expand) => {
              setActiveTab(tab);
              if (tab === 'refueling') setExpandRefuel(expand);
              if (tab === 'expenses') setExpandExpense(expand);
            }} 
            onOpenVehicleManager={() => setShowVehicleModal(true)}
          />
        )}
        {activeTab === 'refueling' && (
          <RefuelingForm 
            currentVehicleId={currentVehicleId}
            expandForm={expandRefuel} 
            setExpandForm={setExpandRefuel} 
          />
        )}
        {activeTab === 'expenses' && (
          <ExpenseForm 
            currentVehicleId={currentVehicleId}
            expandForm={expandExpense} 
            setExpandForm={setExpandExpense} 
          />
        )}
        {activeTab === 'sync' && <SyncBackup />}
      </main>

      {/* Smart Floating PWA Install Banner */}
      {showPwaBanner && (
        <div className="fixed bottom-[74px] left-4 right-4 max-w-[calc(100%-2rem)] sm:max-w-[544px] md:max-w-[640px] mx-auto z-40 bg-slate-900/98 border border-brand-500/20 p-3.5 rounded-2xl shadow-2xl shadow-black/90 flex items-center justify-between gap-3 animate-fade-in transition-all">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
              📲 Tải ứng dụng Xăng Xe PWA
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {isIOS ? (
                <span>Nhấp chọn nút **Chia sẻ 📤** trên trình duyệt Safari → Chọn **Thêm vào MH chính ➕**.</span>
              ) : (
                <span>Cài đặt ứng dụng lên màn hình chính để sử dụng toàn màn hình và mở ngoại tuyến không cần mạng.</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallPwa}
                className="text-[10px] font-bold text-white bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 px-3 py-1.5 rounded-xl shadow-md transition active:scale-95"
              >
                Cài đặt
              </button>
            )}
            <button
              onClick={handleDismissPwaBanner}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition"
              title="Ẩn gợi ý trong 7 ngày"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Smart Floating PWA Update Toast - Kích hoạt khi phát hiện phiên bản mới hoặc sẵn sàng Offline */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-[74px] left-4 right-4 max-w-[calc(100%-2rem)] sm:max-w-[544px] md:max-w-[640px] mx-auto z-50 bg-slate-900/98 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl shadow-black/90 flex flex-col gap-2.5 animate-fade-in transition-all">
          <div>
            <h4 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
              {offlineReady ? '📲 Đã sẵn sàng chạy Ngoại tuyến' : '✨ Có phiên bản mới'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {offlineReady 
                ? 'Ứng dụng đã được tải về bộ nhớ đệm và sẵn sàng sử dụng offline (không cần mạng).' 
                : 'Ứng dụng Xăng Xe vừa có bản cập nhật mới trên máy chủ. Vui lòng làm mới để nạp ngay tính năng mới nhất.'}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3.5 py-1.5 rounded-xl shadow-md transition active:scale-95"
              >
                Cập nhật ngay
              </button>
            )}
            <button
              onClick={() => {
                setOfflineReady(false);
                setNeedRefresh(false);
              }}
              className="text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-750 px-3.5 py-1.5 rounded-xl transition active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabbar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-xl md:max-w-2xl mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl tab-bar-safe z-50 transition-all duration-300">
        <div className="grid grid-cols-4 py-2">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'dashboard' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-bold">Tổng quan</span>
          </button>

          {/* Refuel Tab */}
          <button
            onClick={() => setActiveTab('refueling')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'refueling' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Fuel className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-bold">Đổ xăng</span>
          </button>

          {/* Expense Tab */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'expenses' ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wrench className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-bold">Chi phí</span>
          </button>

          {/* Cloud Sync Tab */}
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'sync' ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Cloud className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-bold">Đồng bộ</span>
          </button>
        </div>
      </nav>

      {/* Vehicle Manager Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-sm p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Car className="w-5 h-5 text-brand-400" />
                Chọn & Quản lý xe
              </h3>
              <button 
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicleId(null);
                  setNewVehicleName('');
                  setNewVehiclePlate('');
                  setNewVehicleTankCapacity('');
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Vehicles */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">Danh sách xe của bạn</p>
              {vehicles?.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => handleSelectVehicle(v.id)}
                  className={`bg-slate-900 border rounded-xl p-3 flex justify-between items-center cursor-pointer transition active:scale-98 ${
                    v.id.toString() === currentVehicleId 
                      ? 'border-brand-500 bg-brand-500/5' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      {v.type === 'Motorcycle' ? (
                        <Bike className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Car className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      )}
                      <p className="text-sm font-bold text-slate-100 truncate">{v.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Biển số: {v.plateNumber || 'Không có'} • Dung tích bình: {v.tankCapacity ? `${v.tankCapacity}L` : 'Chưa nhập'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Nút sửa xe */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVehicle(v);
                      }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold px-2 py-1.5 hover:bg-slate-800 rounded-lg transition"
                    >
                      Sửa
                    </button>

                    {v.id.toString() === currentVehicleId ? (
                      <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                        Đang chọn
                      </span>
                    ) : (
                      vehicles.length > 1 && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc chắn muốn xóa xe "${v.name}" và toàn bộ dữ liệu đổ xăng, chi phí của xe này?`)) {
                              await db.vehicles.delete(v.id);
                              await db.refuelings.where('vehicleId').equals(v.id).delete();
                              await db.expenses.where('vehicleId').equals(v.id).delete();
                            }
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-400 font-bold px-2.5 py-1 hover:bg-rose-950/20 rounded-lg transition"
                        >
                          Xóa
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit New Vehicle Form */}
            <form onSubmit={handleAddVehicle} className="space-y-3 pt-3 border-t border-slate-900">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">
                {editingVehicleId ? 'Sửa thông tin xe' : 'Thêm phương tiện mới'}
              </p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Tên xe (VD: Honda Vision)"
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  className="glass-input text-sm py-2"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    className="glass-input text-sm py-2"
                  >
                    <option value="Motorcycle" className="bg-slate-900">Xe máy</option>
                    <option value="Car" className="bg-slate-900">Ô tô</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Biển số (VD: 29A-123.45)"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value)}
                    className="glass-input text-sm py-2"
                  />
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Dung tích bình xăng (Lít - VD: 5.2)"
                  value={newVehicleTankCapacity}
                  onChange={(e) => setNewVehicleTankCapacity(e.target.value)}
                  className="glass-input text-sm py-2 w-full"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <button
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  {editingVehicleId ? 'Lưu cập nhật' : 'Thêm xe mới'}
                </button>
                {editingVehicleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicleId(null);
                      setNewVehicleName('');
                      setNewVehiclePlate('');
                      setNewVehicleTankCapacity('');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 rounded-xl text-sm transition active:scale-95"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
