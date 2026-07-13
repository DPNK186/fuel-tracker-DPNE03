import React, { useState, useEffect } from 'react';
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

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicleName) return;

    await db.vehicles.add({
      name: newVehicleName,
      type: newVehicleType,
      plateNumber: newVehiclePlate
    });

    setNewVehicleName('');
    setNewVehiclePlate('');
    setShowVehicleModal(false);
  };

  return (
    /* Đổi max-w-md thành w-full max-w-md sm:max-w-xl md:max-w-2xl để co giãn responsive mượt mà trên desktop */
    <div className="min-h-screen bg-slate-950 flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto relative shadow-2xl border-x border-slate-900 transition-all duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-card px-5 py-3.5 flex items-center justify-between border-b border-slate-900 rounded-b-2xl">
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
            className="bg-slate-900 hover:bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-white border border-slate-800 transition"
            title="Quản lý xe"
          >
            <Car className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 px-4 py-5 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <Dashboard 
            onQuickAction={(tab, expand) => {
              setActiveTab(tab);
              if (tab === 'refueling') setExpandRefuel(expand);
              if (tab === 'expenses') setExpandExpense(expand);
            }} 
          />
        )}
        {activeTab === 'refueling' && (
          <RefuelingForm 
            expandForm={expandRefuel} 
            setExpandForm={setExpandRefuel} 
          />
        )}
        {activeTab === 'expenses' && (
          <ExpenseForm 
            expandForm={expandExpense} 
            setExpandForm={setExpandExpense} 
          />
        )}
        {activeTab === 'sync' && <SyncBackup />}
      </main>

      {/* Navigation Tabbar - Cập nhật max-w đồng bộ với container cha */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-xl md:max-w-2xl mx-auto glass-card border-t border-slate-900 rounded-t-3xl tab-bar-safe z-50 transition-all duration-300">
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

          {/* Expense Tab - Màu đỏ/cam active */}
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
                Quản lý phương tiện
              </h3>
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Vehicles */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-1">Xe hiện tại</p>
              {vehicles?.map(v => (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-100">{v.name}</p>
                    <p className="text-[10px] text-slate-500">Biển số: {v.plateNumber || 'Không có'} • Loại: {v.type === 'Motorcycle' ? 'Xe máy' : 'Ô tô'}</p>
                  </div>
                  {vehicles.length > 1 && (
                    <button 
                      onClick={() => db.vehicles.delete(v.id)}
                      className="text-xs text-rose-500 hover:text-rose-400 font-medium px-2 py-1 hover:bg-rose-950/20 rounded-md transition"
                    >
                      Xóa
                    </button>
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
