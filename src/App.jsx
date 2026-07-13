import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import Dashboard from './components/Dashboard';
import RefuelingForm from './components/RefuelingForm';
import ExpenseForm from './components/ExpenseForm';
import SyncBackup from './components/SyncBackup';
import { 
  LayoutDashboard, 
  Fuel, 
  Wrench, 
  Cloud, 
  Car, 
  Bike, // Thêm Bike icon cho xe máy
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
  }, [vehicles, currentVehicleId]);

  const handleSelectVehicle = (id) => {
    setCurrentVehicleId(id.toString());
    localStorage.setItem('active_vehicle_id', id.toString());
    setShowVehicleModal(false);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicleName) return;

    // Kiểm tra xem trong DB hiện tại có xe mẫu mặc định biển số 29A-123.45 hay không
    const sampleVehicle = vehicles?.find(v => v.plateNumber === '29A-123.45');

    // Nếu có xe mẫu và người dùng đang bắt đầu thêm xe thật của họ
    if (sampleVehicle) {
      const sampleId = sampleVehicle.id;
      // Tự động xóa sạch xe mẫu cùng các dữ liệu mẫu liên kết
      await db.vehicles.delete(sampleId);
      await db.refuelings.where('vehicleId').equals(sampleId).delete();
      await db.expenses.where('vehicleId').equals(sampleId).delete();
    }

    const newId = await db.vehicles.add({
      name: newVehicleName,
      type: newVehicleType,
      plateNumber: newVehiclePlate
    });

    setNewVehicleName('');
    setNewVehiclePlate('');
    
    // Tự động đặt xe mới làm xe hiện hành
    setCurrentVehicleId(newId.toString());
    localStorage.setItem('active_vehicle_id', newId.toString());
    
    setShowVehicleModal(false);
  };

  // Xác định thông tin xe hiện tại đang chọn
  const activeVehicle = useMemo(() => {
    if (!vehicles || !currentVehicleId) return null;
    return vehicles.find(v => v.id.toString() === currentVehicleId) || vehicles[0];
  }, [vehicles, currentVehicleId]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto relative shadow-2xl border-x border-slate-900 transition-all duration-300">
      {/* Top Header - Đổi sang bg-slate-900 solid đục hoàn toàn để tránh đè chữ khi cuộn */}
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

          {/* Manage Vehicle Button - Đồng bộ icon & Tên xe hiện đang chọn */}
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

      {/* Navigation Tabbar - Đổi sang bg-slate-900 solid đục hoàn toàn để tránh đè chữ khi cuộn */}
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
                onClick={() => setShowVehicleModal(false)}
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
                    <p className="text-[10px] text-slate-500 mt-1">Biển số: {v.plateNumber || 'Không có'} • Loại: {v.type === 'Motorcycle' ? 'Xe máy' : 'Ô tô'}</p>
                  </div>
                  
                  {v.id.toString() === currentVehicleId ? (
                    <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                      Đang chọn
                    </span>
                  ) : (
                    vehicles.length > 1 && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation(); // Ngăn chọn xe khi bấm xóa
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
              ))}
            </div>

            {/* Add New Vehicle Form */}
            <form onSubmit={handleAddVehicle} className="space-y-3 pt-3 border-t border-slate-900">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">Thêm phương tiện mới</p>
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
              </div>
              
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                Thêm xe mới
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
