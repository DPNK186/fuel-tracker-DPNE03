import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Fuel, Calendar, Compass, Coins, PlusCircle, Trash2, Edit2, TrendingUp, X, AlertTriangle } from 'lucide-react';

// Chuẩn hóa số thập phân: đổi dấu phẩy thành dấu chấm và chỉ cho phép tối đa 1 dấu chấm
const normalizeDecimal = (str) => {
  if (typeof str !== 'string') return '';
  let cleaned = str.replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

// Chuẩn hóa số nguyên tiền tệ
const normalizeInteger = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[^0-9]/g, '');
};

// Trọng số ưu tiên mặc định: Tổng tiền > Số lít > Đơn giá
const FIELD_PRIORITY = { total: 3, liters: 2, price: 1 };

export default function RefuelingForm({ currentVehicleId, expandForm, setExpandForm }) {
  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const refuelings = useLiveQuery(() => db.refuelings.orderBy('odometer').reverse().toArray());

  const [vehicleId, setVehicleId] = useState(currentVehicleId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [fuelType, setFuelType] = useState('E10 Ron 95');
  const [fullTank, setFullTank] = useState(true);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);

  // State quản lý cảnh báo nhập liệu thời gian thực
  const [formWarnings, setFormWarnings] = useState([]);

  // Ref theo dõi lịch sử thứ tự các trường người dùng vừa trực tiếp gõ/sửa
  const editOrderRef = useRef([]);

  const dateInputRef = useRef(null);

  // Đồng bộ mặc định xe của Form theo xe hiện hành được chọn ngoài Header
  useEffect(() => {
    if (currentVehicleId) {
      setVehicleId(currentVehicleId);
    }
  }, [currentVehicleId]);

  // Tự động gợi ý đơn giá từ lần đổ gần nhất của xe & loại nhiên liệu khi mở form thêm mới
  useEffect(() => {
    if (!editingId && expandForm && vehicleId && refuelings && refuelings.length > 0) {
      // Chỉ gợi ý nếu người dùng chưa nhập số lít hoặc tổng tiền
      if (!liters && !totalCost) {
        const latestMatching = refuelings.find(
          r => r.vehicleId === parseInt(vehicleId) && r.fuelType === fuelType && r.pricePerLiter > 0
        ) || refuelings.find(
          r => r.vehicleId === parseInt(vehicleId) && r.pricePerLiter > 0
        );

        if (latestMatching && latestMatching.pricePerLiter) {
          const suggestedPrice = Math.round(latestMatching.pricePerLiter).toString();
          setPricePerLiter(suggestedPrice);
          editOrderRef.current = ['price'];
        }
      }
    }
  }, [editingId, expandForm, vehicleId, fuelType, refuelings]);

  // Hàm chuyển YYYY-MM-DD sang DD/MM/YYYY
  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Thuật toán kiểm tra và đưa ra cảnh báo thông minh
  const getValidationWarnings = (inputOdo, inputLiters, inputDate, inputVehicleId) => {
    if (!inputOdo || !inputLiters || !inputDate || !inputVehicleId) return [];

    const odoNum = parseInt(inputOdo);
    const litersNum = parseFloat(inputLiters);
    const warnings = [];

    const currentVehicle = vehicles?.find(v => v.id.toString() === inputVehicleId.toString());
    const capacity = currentVehicle?.tankCapacity || (currentVehicle?.type === 'Motorcycle' ? 6 : 60);

    // 1. Cảnh báo lượng xăng đổ vượt quá dung tích bình xăng của xe
    if (litersNum > capacity) {
      warnings.push(`Lượng xăng đổ (${litersNum}L) vượt quá dung tích bình xăng của xe (${capacity}L).`);
    }

    // Lấy tất cả các bản ghi của xe này trừ bản ghi đang sửa (nếu có)
    const activeLogs = refuelings
      ? refuelings
          .filter(log => log.vehicleId === parseInt(inputVehicleId) && log.id !== editingId)
          .sort((a, b) => a.odometer - b.odometer)
      : [];

    if (activeLogs.length > 0) {
      // 2. Cảnh báo nhập nhầm ODO (thứ tự ODO không khớp với trình tự thời gian)
      const beforeLogs = activeLogs.filter(log => log.date < inputDate);
      const afterLogs = activeLogs.filter(log => log.date > inputDate);
      const sameDayLogs = activeLogs.filter(log => log.date === inputDate);

      // ODO nhập nhỏ hơn ODO của một lần đổ ở ngày trước đó
      const odoClashBefore = beforeLogs.some(log => log.odometer > odoNum);
      if (odoClashBefore) {
        warnings.push("ODO nhập nhỏ hơn lần đổ ở ngày trước đó (có thể nhập nhầm ODO).");
      }

      // ODO nhập lớn hơn ODO của một lần đổ ở ngày sau đó
      const odoClashAfter = afterLogs.some(log => log.odometer < odoNum);
      if (odoClashAfter) {
        warnings.push("ODO nhập lớn hơn lần đổ ở ngày sau đó (có thể nhập nhầm ODO).");
      }

      // Kiểm tra trùng ODO trong cùng một ngày
      const odoClashSameDay = sameDayLogs.some(log => log.odometer === odoNum);
      if (odoClashSameDay) {
        warnings.push("Chỉ số ODO nhập bị trùng với một lần đổ khác trong cùng ngày.");
      }

      // 3. Cảnh báo quãng đường di chuyển giữa 2 lần đổ quá dài (bỏ quên không nhập)
      const pastLogs = activeLogs.filter(log => log.odometer < odoNum);
      if (pastLogs.length > 0) {
        const lastLog = pastLogs[pastLogs.length - 1];
        const distance = odoNum - lastLog.odometer;

        // Công thức tính ngưỡng cảnh báo: Dung tích * 1.5 * hiệu suất trung bình giả định (60 cho xe máy, 18 cho ô tô)
        const efficiencyRate = currentVehicle?.type === 'Motorcycle' ? 60 : 18;
        const limit = capacity * 1.5 * efficiencyRate;

        if (distance > limit) {
          warnings.push(`Quãng đường giữa 2 lần đổ khá dài (${distance} km > ngưỡng ${Math.round(limit)} km). Bạn có quên ghi nhận lần đổ nào ở giữa không?`);
        }
      }
    }

    return warnings;
  };

  // Cập nhật cảnh báo thời gian thực khi người dùng gõ
  useEffect(() => {
    const warns = getValidationWarnings(odometer, liters, date, vehicleId);
    setFormWarnings(warns);
  }, [odometer, liters, date, vehicleId, vehicles, refuelings]);

  // Tính toán hiệu suất (km/L) cho từng bản ghi lịch sử đổ xăng của xe hiện hành
  const processedRefuelings = useMemo(() => {
    if (!refuelings || !currentVehicleId) return [];

    // Chỉ lọc các bản ghi đổ xăng thuộc về xe hiện tại đang chọn
    const activeLogs = refuelings.filter(log => log.vehicleId === parseInt(currentVehicleId));

    const sorted = [...activeLogs].sort((a, b) => a.odometer - b.odometer);
    const effMap = new Map();

    let accumulatedLiters = 0;
    let lastFullRefueling = null;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const isFull = item.fullTank !== false;

      if (isFull) {
        if (lastFullRefueling !== null) {
          const distance = item.odometer - lastFullRefueling.odometer;
          const totalLiters = accumulatedLiters + item.liters;

          if (distance > 0 && totalLiters > 0) {
            const eff = distance / totalLiters;
            effMap.set(item.id, parseFloat(eff.toFixed(2)));
          }
          accumulatedLiters = 0;
        }
        lastFullRefueling = item;
      } else {
        accumulatedLiters += item.liters;
      }
    }

    return activeLogs.map(log => ({
      ...log,
      efficiency: effMap.get(log.id) || null
    }));
  }, [refuelings, currentVehicleId]);

  // Thuật toán tính toán linh hoạt 3 trường: Tổng tiền > Số lít > Đơn giá
  const recalculateFields = (changedField, newVal) => {
    // Thu thập giá trị hiện tại của 3 trường (sử dụng newVal cho trường vừa sửa)
    const currentValues = {
      liters: changedField === 'liters' ? newVal : liters,
      price: changedField === 'price' ? newVal : pricePerLiter,
      total: changedField === 'total' ? newVal : totalCost,
    };

    const numVal = parseFloat(newVal);

    // Nếu người dùng xóa trống hoặc nhập <= 0 hoặc đang gõ dở chuỗi không phải số
    if (!newVal || isNaN(numVal) || numVal <= 0) {
      editOrderRef.current = editOrderRef.current.filter(f => f !== changedField);
      return;
    }

    // Cập nhật thứ tự thao tác: trường vừa sửa được xếp ở cuối mảng (mới nhất)
    const newOrder = editOrderRef.current.filter(f => f !== changedField).concat(changedField);
    editOrderRef.current = newOrder;

    const otherFields = ['liters', 'price', 'total'].filter(f => f !== changedField);
    const [fieldA, fieldB] = otherFields;

    const valA = parseFloat(currentValues[fieldA]);
    const valB = parseFloat(currentValues[fieldB]);

    const hasA = !isNaN(valA) && valA > 0;
    const hasB = !isNaN(valB) && valB > 0;

    let targetToCalc = null;

    if (hasA && !hasB) {
      // fieldA có giá trị, fieldB chưa có -> tính fieldB
      targetToCalc = fieldB;
    } else if (!hasA && hasB) {
      // fieldB có giá trị, fieldA chưa có -> tính fieldA
      targetToCalc = fieldA;
    } else if (hasA && hasB) {
      // Cả 3 trường đều có dữ liệu -> Xác định trường cũ nhất để tính lại
      const idxA = editOrderRef.current.indexOf(fieldA);
      const idxB = editOrderRef.current.indexOf(fieldB);

      if (idxA !== idxB) {
        // Trường có index thấp hơn (hoặc -1) là trường cũ hơn -> tính lại trường đó
        targetToCalc = idxA < idxB ? fieldA : fieldB;
      } else {
        // Nếu bằng nhau (chưa có trong vết thao tác gần), áp dụng thứ tự ưu tiên:
        // Tổng tiền (3) > Số lít (2) > Đơn giá (1) -> Trường có trọng số thấp hơn sẽ bị tính lại
        targetToCalc = (FIELD_PRIORITY[fieldA] || 0) < (FIELD_PRIORITY[fieldB] || 0) ? fieldA : fieldB;
      }
    }

    if (!targetToCalc) return;

    // Lấy giá trị số của các trường để tính toán
    const L = changedField === 'liters' ? numVal : parseFloat(currentValues.liters);
    const P = changedField === 'price' ? numVal : parseFloat(currentValues.price);
    const T = changedField === 'total' ? numVal : parseFloat(currentValues.total);

    if (targetToCalc === 'total') {
      // Tổng tiền = Số lít * Đơn giá (làm tròn số nguyên VND)
      if (L > 0 && P > 0) {
        const calcTotal = Math.round(L * P);
        setTotalCost(calcTotal.toString());
      }
    } else if (targetToCalc === 'price') {
      // Đơn giá = Tổng tiền / Số lít (làm tròn số nguyên VND/L)
      if (T > 0 && L > 0) {
        const calcPrice = Math.round(T / L);
        setPricePerLiter(calcPrice.toString());
      }
    } else if (targetToCalc === 'liters') {
      // Số lít = Tổng tiền / Đơn giá (làm tròn 1 chữ số thập phân)
      if (T > 0 && P > 0) {
        const calcLiters = parseFloat((T / P).toFixed(1));
        setLiters(calcLiters.toString());
      }
    }
  };

  const handleLitersChange = (val) => {
    const cleaned = normalizeDecimal(val);
    setLiters(cleaned);
    recalculateFields('liters', cleaned);
  };

  const handlePriceChange = (val) => {
    const cleaned = normalizeInteger(val);
    setPricePerLiter(cleaned);
    recalculateFields('price', cleaned);
  };

  const handleTotalCostChange = (val) => {
    const cleaned = normalizeInteger(val);
    setTotalCost(cleaned);
    recalculateFields('total', cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId || !odometer || !liters || !totalCost) {
      alert('Vui lòng nhập đầy đủ các trường thông tin bắt buộc');
      return;
    }

    // Chạy kiểm tra cảnh báo cuối cùng để lưu vào DB
    const currentWarnings = getValidationWarnings(odometer, liters, date, vehicleId);
    const hasWarning = currentWarnings.length > 0;
    const warningReason = currentWarnings.join('; ');

    const data = {
      vehicleId: parseInt(vehicleId),
      date,
      odometer: parseInt(odometer),
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter) || 0,
      totalCost: parseFloat(totalCost),
      fuelType,
      fullTank,
      notes,
      hasWarning,
      warningReason
    };

    try {
      if (editingId) {
        await db.refuelings.update(editingId, data);
        setEditingId(null);
      } else {
        await db.refuelings.add(data);
      }
      
      // Reset form & Thu gọn form
      setOdometer('');
      setLiters('');
      setPricePerLiter('');
      setTotalCost('');
      setFuelType('E10 Ron 95');
      setFullTank(true);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setExpandForm(false);
      editOrderRef.current = [];

      // Đặt cờ báo có dữ liệu mới chưa đồng bộ
      localStorage.setItem('google_drive_unsynced_changes', 'true');
      window.dispatchEvent(new CustomEvent('unsynced-changes-updated'));
    } catch (err) {
      console.error('Error saving refueling log:', err);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setVehicleId(log.vehicleId.toString());
    setDate(log.date);
    setOdometer(log.odometer.toString());
    setLiters(log.liters.toString());
    setPricePerLiter(log.pricePerLiter ? log.pricePerLiter.toString() : '');
    setTotalCost(log.totalCost.toString());
    setFuelType(log.fuelType || 'E10 Ron 95');
    setFullTank(log.fullTank !== false);
    setNotes(log.notes || '');
    setExpandForm(true);
    // Ưu tiên mặc định khi sửa: Tổng tiền (3) > Số lít (2) > Đơn giá (1)
    editOrderRef.current = ['price', 'liters', 'total'];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      await db.refuelings.delete(id);
      localStorage.setItem('google_drive_unsynced_changes', 'true');
      window.dispatchEvent(new CustomEvent('unsynced-changes-updated'));
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      {/* Form Nhập liệu */}
      {expandForm ? (
        <div className="glass-card rounded-3xl p-6 animate-fade-in border-brand-500/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Fuel className="text-brand-500 w-6 h-6" />
              {editingId ? 'Sửa lịch sử đổ xăng' : 'Nhập lịch sử đổ xăng'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setExpandForm(false);
                setEditingId(null);
                editOrderRef.current = [];
              }}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Đóng form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hàng 1: Xe sử dụng */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Xe sử dụng</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="glass-input"
              >
                {vehicles?.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900">{v.name} ({v.plateNumber})</option>
                ))}
              </select>
            </div>

            {/* Hàng 2: Ngày đổ & Chỉ số ODO */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Ngày đổ *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateToDisplay(date)}
                    onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}
                    className="glass-input !pl-10 w-full cursor-pointer text-left"
                    placeholder="Chọn ngày"
                  />
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full pointer-events-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Chỉ số ODO (km) *</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="number"
                    placeholder="Ví dụ: 12000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="glass-input !pl-10 w-full"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hàng 3: Số lít & Đơn giá */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Số lít xăng (L) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ví dụ: 4.5"
                  value={liters}
                  onChange={(e) => handleLitersChange(e.target.value)}
                  className="glass-input w-full text-left"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Đơn giá (đ/L)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 23500"
                  value={pricePerLiter}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="glass-input w-full text-left"
                />
              </div>
            </div>

            {/* Hàng 4: Loại xăng & Tổng tiền */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Loại xăng</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="E10 Ron 95" className="bg-slate-900">E10 Ron 95</option>
                  <option value="E5 Ron 92" className="bg-slate-900">E5 Ron 92</option>
                  <option value="Diesel" className="bg-slate-900">Diesel</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Tổng tiền (VND) *</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ví dụ: 100000"
                    value={totalCost}
                    onChange={(e) => handleTotalCostChange(e.target.value)}
                    className="glass-input !pl-9 w-full text-left"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dòng gợi ý trực quan tính năng tự động tính toán linh hoạt */}
            <p className="text-[11px] text-brand-400/90 bg-brand-500/5 border border-brand-500/10 rounded-xl px-3 py-2 flex items-center gap-1.5 animate-fade-in">
              <span className="text-amber-400">💡</span>
              <span>Mẹo: Nhập 2 trường bất kỳ, hệ thống sẽ tự động tính trường còn lại.</span>
            </p>

            {/* Checkbox Đầy bình */}
            <div className="flex items-center gap-2 pl-1 py-1">
              <input
                type="checkbox"
                id="fullTank"
                checked={fullTank}
                onChange={(e) => setFullTank(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 bg-slate-900 border-slate-700 focus:ring-brand-500/20 accent-brand-500"
              />
              <label htmlFor="fullTank" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Đổ đầy bình (Đánh dấu để tính hiệu suất km/L)
              </label>
            </div>

            {/* Dòng cảnh báo thời gian thực */}
            {formWarnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] p-3 rounded-2xl space-y-1 animate-fade-in pl-10 relative">
                <AlertTriangle className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <p className="font-bold text-xs mb-1">Cảnh báo nhập liệu:</p>
                {formWarnings.map((w, idx) => (
                  <p key={idx} className="leading-relaxed">- {w}</p>
                ))}
              </div>
            )}

            {/* Ghi chú */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Ghi chú</label>
              <textarea
                placeholder="Nhập ghi chú (VD: trạm xăng Petrolimex)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input h-20 resize-none"
              />
            </div>

            {/* Nút gửi form */}
            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {editingId ? 'Lưu thay đổi' : 'Ghi nhận đổ xăng'}
            </button>
          </form>
        </div>
      ) : (
        /* Nút thêm mới */
        <button
          onClick={() => setExpandForm(true)}
          className="w-full bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all duration-100 animate-fade-in"
        >
          <PlusCircle className="w-5 h-5" />
          Thêm lần đổ xăng mới
        </button>
      )}

      {/* History List Card */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <h3 className="text-lg font-bold mb-4">Lịch sử đổ xăng</h3>
        <div className="space-y-3">
          {processedRefuelings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có lịch sử đổ xăng nào của xe này</p>
          ) : (
            processedRefuelings.map((log) => (
              <div
                key={log.id}
                className={`border rounded-2xl p-4 flex justify-between items-center transition ${
                  log.hasWarning 
                    ? 'bg-amber-500/[0.03] border-amber-500/30 hover:border-amber-500/50' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-brand-400 text-sm">
                      {log.totalCost.toLocaleString('vi-VN')} VND
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{formatDateToDisplay(log.date)}</span>
                    
                    {log.fullTank !== false ? (
                      <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-semibold">
                        Đầy bình
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-semibold">
                        Không đầy
                      </span>
                    )}

                    {/* Dấu chấm than cảnh báo màu cam nếu có bất thường */}
                    {log.hasWarning && (
                      <span 
                        className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-bold cursor-help"
                        title={log.warningReason}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Cảnh báo
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <span>ODO: {log.odometer.toLocaleString('vi-VN')} km</span>
                    <span>Lượng: {log.liters} L ({log.fuelType || 'E10 Ron 95'})</span>
                    {log.pricePerLiter > 0 && <span>Đơn giá: {log.pricePerLiter.toLocaleString('vi-VN')} đ/L</span>}
                  </div>
                  {log.efficiency && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-1 bg-emerald-950/20 px-2 py-1 rounded-lg w-max border border-emerald-900/30">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Trung bình: {log.efficiency} km/L</span>
                    </div>
                  )}
                  {log.notes && (
                    <p className="text-xs italic text-slate-500 mt-1 bg-slate-950/40 p-1.5 px-2 rounded-md">
                      {log.notes}
                    </p>
                  )}

                  {/* Hiển thị chi tiết lý do cảnh báo dưới dòng lịch sử */}
                  {log.hasWarning && log.warningReason && (
                    <p className="text-[10px] text-amber-500 bg-amber-500/[0.04] border border-amber-500/10 p-1.5 px-2 rounded-lg mt-1.5 leading-relaxed">
                      ⚠️ <strong>Lưu ý:</strong> {log.warningReason}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
