import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Fuel, DollarSign, Compass, TrendingUp, BarChart3, Car, Bike, Plus, Sparkles } from 'lucide-react';

export default function Dashboard({ currentVehicleId, onQuickAction, onOpenVehicleManager }) {
  const refuelings = useLiveQuery(() => db.refuelings.orderBy('odometer').toArray());
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').toArray());
  const vehicles = useLiveQuery(() => db.vehicles.toArray());

  // Lọc dữ liệu đổ xăng và chi phí theo phương tiện hiện hành được chọn
  const activeRefuelings = useMemo(() => {
    if (!refuelings || !currentVehicleId) return [];
    return refuelings.filter(r => r.vehicleId === parseInt(currentVehicleId));
  }, [refuelings, currentVehicleId]);

  const activeExpenses = useMemo(() => {
    if (!expenses || !currentVehicleId) return [];
    return expenses.filter(e => e.vehicleId === parseInt(currentVehicleId));
  }, [expenses, currentVehicleId]);

  // Xác định phương tiện hiện hành
  const activeVehicle = useMemo(() => {
    if (!vehicles || !currentVehicleId) return null;
    return vehicles.find(v => v.id.toString() === currentVehicleId) || vehicles[0];
  }, [vehicles, currentVehicleId]);

  // 1. Tính toán hiệu suất tiêu thụ nhiên liệu (km/L) cho từng điểm đổ đầy bình của xe hiện hành
  const efficiencyPoints = useMemo(() => {
    if (activeRefuelings.length < 2) return [];

    const points = [];
    let accumulatedLiters = 0;
    let lastFullRefueling = null;

    const sorted = [...activeRefuelings].sort((a, b) => a.odometer - b.odometer);

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const isFull = item.fullTank !== false;

      if (isFull) {
        if (lastFullRefueling !== null) {
          const distance = item.odometer - lastFullRefueling.odometer;
          const totalLiters = accumulatedLiters + item.liters;

          if (distance > 0 && totalLiters > 0) {
            const kmPerLiter = distance / totalLiters;
            points.push({
              id: item.id,
              date: item.date,
              odometer: item.odometer,
              kmPerLiter: parseFloat(kmPerLiter.toFixed(2)),
              distance,
              liters: totalLiters
            });
          }
          accumulatedLiters = 0;
        }
        lastFullRefueling = item;
      } else {
        accumulatedLiters += item.liters;
      }
    }

    return points;
  }, [activeRefuelings]);

  // 2. Tính toán các thống kê tổng quan của xe hiện hành
  const stats = useMemo(() => {
    if (activeRefuelings.length === 0 && activeExpenses.length === 0) return {
      totalFuelCost: 0,
      totalExpenseCost: 0,
      totalCost: 0,
      totalLiters: 0,
      distance: 0,
      avgEfficiency: 0
    };

    const totalFuelCost = activeRefuelings.reduce((sum, item) => sum + item.totalCost, 0);
    const totalExpenseCost = activeExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = totalFuelCost + totalExpenseCost;
    const totalLiters = activeRefuelings.reduce((sum, item) => sum + item.liters, 0);

    let avgEfficiency = 0;
    let totalDistanceForEfficiency = 0;

    const sortedRefuelings = [...activeRefuelings].sort((a, b) => a.odometer - b.odometer);
    const fullRefuelings = sortedRefuelings.filter(r => r.fullTank !== false);

    if (fullRefuelings.length >= 2) {
      const firstFull = fullRefuelings[0];
      const lastFull = fullRefuelings[fullRefuelings.length - 1];
      
      const distance = lastFull.odometer - firstFull.odometer;
      totalDistanceForEfficiency = distance;

      if (distance > 0) {
        const firstFullIndex = sortedRefuelings.findIndex(r => r.id === firstFull.id);
        const lastFullIndex = sortedRefuelings.findIndex(r => r.id === lastFull.id);
        
        const litersConsumed = sortedRefuelings
          .slice(firstFullIndex + 1, lastFullIndex + 1)
          .reduce((sum, item) => sum + item.liters, 0);

        if (litersConsumed > 0) {
          avgEfficiency = distance / litersConsumed;
        }
      }
    }

    return {
      totalFuelCost,
      totalExpenseCost,
      totalCost,
      totalLiters,
      distance: totalDistanceForEfficiency,
      avgEfficiency: avgEfficiency ? parseFloat(avgEfficiency.toFixed(2)) : 0
    };
  }, [activeRefuelings, activeExpenses]);

  // 3. Chuẩn bị dữ liệu vẽ biểu đồ hiệu suất (km/L)
  const chartData = useMemo(() => {
    if (efficiencyPoints.length < 1) return [];

    const recent = efficiencyPoints.slice(-7);
    const efficiencies = recent.map(p => p.kmPerLiter);
    
    const minEff = Math.min(...efficiencies) * 0.9;
    const maxEff = Math.max(...efficiencies) * 1.1;
    const effRange = (maxEff - minEff) || 1;

    const width = 500;
    const height = 150;
    const padding = 30;

    const points = recent.map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / (recent.length === 1 ? 1 : recent.length - 1);
      const y = height - padding - ((item.kmPerLiter - minEff) * (height - padding * 2)) / effRange;
      return { x, y, value: item.kmPerLiter, date: item.date.slice(5) };
    });

    let pathD = '';
    if (points.length > 0) {
      if (points.length === 1) {
        pathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
      } else {
        pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      }
    }

    let areaD = '';
    if (points.length > 0) {
      if (points.length === 1) {
        areaD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y} L ${points[0].x + 20} ${height - padding} L ${points[0].x - 20} ${height - padding} Z`;
      } else {
        areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
      }
    }

    return { points, pathD, areaD, width, height, padding };
  }, [efficiencyPoints]);

  const isNoVehicles = !vehicles || vehicles.length === 0;

  // Kiểm tra xem ứng dụng chỉ có đúng xe mẫu mặc định ban đầu
  const isOnlySampleVehicle = useMemo(() => {
    if (!vehicles || vehicles.length !== 1) return false;
    return vehicles[0].plateNumber === '29A-123.45';
  }, [vehicles]);

  if (isNoVehicles) {
    return (
      <div className="space-y-6 max-w-lg mx-auto pb-24">
        <div className="glass-card rounded-3xl p-8 text-center space-y-5 animate-fade-in border-dashed border-slate-800">
          <div className="bg-slate-900/60 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-800">
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-200">Chưa có phương tiện nào</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Vui lòng thêm phương tiện cá nhân của bạn (Xe máy hoặc Ô tô) để bắt đầu ghi nhận và theo dõi hiệu suất nhiên liệu.
            </p>
          </div>
          <button
            onClick={onOpenVehicleManager}
            className="w-full bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm phương tiện đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      {/* Banner Onboarding gợi ý thêm xe riêng khi dùng xe mẫu */}
      {isOnlySampleVehicle && (
        <div 
          onClick={onOpenVehicleManager}
          className="glass-card rounded-2xl p-4 border border-brand-500/20 bg-brand-500/5 cursor-pointer hover:bg-brand-500/10 active:scale-98 transition flex items-center justify-between animate-fade-in"
        >
          <div className="flex-1 pr-2">
            <h4 className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              Bắt đầu quản lý xe của bạn
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              Hệ thống đang hiển thị dữ liệu mẫu. Bấm vào đây để thêm xe cá nhân của bạn và bắt đầu theo dõi chính xác!
            </p>
          </div>
          <span className="text-[10px] font-bold text-white bg-brand-500/80 hover:bg-brand-600 px-2.5 py-1.5 rounded-lg shadow-sm transition">
            Thêm ngay
          </span>
        </div>
      )}

      {/* Vehicle Info Card - Đồng bộ động theo xe hiện tại */}
      <div className="glass-card rounded-3xl p-5 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500/10 p-3 rounded-2xl text-brand-400">
            {activeVehicle?.type === 'Motorcycle' ? (
              <Bike className="w-6 h-6 text-emerald-400" />
            ) : (
              <Car className="w-6 h-6 text-sky-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{activeVehicle?.name || 'Xe của tôi'}</h3>
            <p className="text-xs text-slate-400">{activeVehicle?.plateNumber || 'Chưa cập nhật biển số'}</p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
          {activeVehicle?.type === 'Motorcycle' ? 'Xe máy' : 'Ô tô'}
        </span>
      </div>

      {/* Quick Actions Buttons */}
      <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.02s' }}>
        <button
          onClick={() => onQuickAction && onQuickAction('refueling', true)}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-100"
        >
          <Plus className="w-5 h-5 text-emerald-100" />
          Đổ xăng
        </button>
        <button
          onClick={() => onQuickAction && onQuickAction('expenses', true)}
          className="flex-1 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-100"
        >
          <Plus className="w-5 h-5 text-rose-100" />
          Chi phí
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Cost */}
        <div className="glass-card rounded-3xl p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng chi phí</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-black text-slate-100">
            {stats.totalCost.toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Xăng: {stats.totalFuelCost.toLocaleString('vi-VN')} đ
          </div>
        </div>

        {/* Efficiency */}
        <div className="glass-card rounded-3xl p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hiệu suất xăng</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-black text-slate-100 flex items-baseline gap-1">
            {stats.avgEfficiency > 0 ? stats.avgEfficiency : '--'}
            {stats.avgEfficiency > 0 && <span className="text-xs font-normal text-slate-400">km/L</span>}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Dựa trên {stats.distance.toLocaleString('vi-VN')} km đầy bình
          </div>
        </div>

        {/* Total Fuel */}
        <div className="glass-card rounded-3xl p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nhiên liệu đã đổ</span>
            <Fuel className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-black text-slate-100 flex items-baseline gap-1">
            {stats.totalLiters.toFixed(1)}
            <span className="text-xs font-normal text-slate-400">Lít</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Tổng số lần đổ: {activeRefuelings?.length || 0}
          </div>
        </div>

        {/* Distance */}
        <div className="glass-card rounded-3xl p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quãng đường tính toán</span>
            <Compass className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-black text-slate-100 flex items-baseline gap-1">
            {stats.distance > 0 ? stats.distance.toLocaleString('vi-VN') : '--'}
            {stats.distance > 0 && <span className="text-xs font-normal text-slate-400">km</span>}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Từ lần đầu tiên đầy bình
          </div>
        </div>
      </div>

      {/* SVG Chart Card */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          Hiệu suất nhiên liệu qua các lần đổ đầy (km/L)
        </h3>

        {chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500 text-center px-4">
              Cần ít nhất 2 lần đổ đầy bình xăng mới đủ dữ liệu vẽ biểu đồ tiêu hao
            </p>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={chartData.padding}
                y1={chartData.height - chartData.padding}
                x2={chartData.width - chartData.padding}
                y2={chartData.height - chartData.padding}
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <line
                x1={chartData.padding}
                y1={chartData.padding}
                x2={chartData.width - chartData.padding}
                y2={chartData.padding}
                stroke="#1e293b"
                strokeDasharray="4 4"
              />

              {/* Gradient Area */}
              <path d={chartData.areaD} fill="url(#chartGradient)" />

              {/* Line Path */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {chartData.points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="6" fill="#15803d" opacity="0.4" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#22c55e"
                    stroke="#0b0f19"
                    strokeWidth="1.5"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {p.value} km/L
                  </text>
                  <text
                    x={p.x}
                    y={chartData.height - 10}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Chi phí theo danh mục */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          Phân tích chi tiêu
        </h3>
        
        <div className="space-y-4">
          {/* Đổ xăng */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
                Nhiên liệu (Xăng/Dầu)
              </span>
              <span className="text-slate-200 font-bold">
                {stats.totalFuelCost.toLocaleString('vi-VN')} đ (
                {stats.totalCost > 0 ? ((stats.totalFuelCost / stats.totalCost) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalCost > 0 ? (stats.totalFuelCost / stats.totalCost) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Chi phí khác */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                Dịch vụ & Chi phí khác
              </span>
              <span className="text-slate-200 font-bold">
                {stats.totalExpenseCost.toLocaleString('vi-VN')} đ (
                {stats.totalCost > 0 ? ((stats.totalExpenseCost / stats.totalCost) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalCost > 0 ? (stats.totalExpenseCost / stats.totalCost) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
