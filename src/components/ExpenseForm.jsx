import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Wrench, Calendar, Compass, Coins, PlusCircle, Trash2, Edit2, Camera, X } from 'lucide-react';

const CATEGORIES = [
  'Bảo dưỡng',
  'Sửa chữa',
  'Phí gửi xe',
  'Rửa xe',
  'Phí cầu đường',
  'Bảo hiểm',
  'Khác'
];

export default function ExpenseForm({ currentVehicleId, expandForm, setExpandForm }) {
  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray());

  const [vehicleId, setVehicleId] = useState(currentVehicleId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  const dateInputRef = useRef(null);

  // Đồng bộ mặc định xe của Form theo xe hiện hành được chọn ngoài Header
  useEffect(() => {
    if (currentVehicleId) {
      setVehicleId(currentVehicleId);
    }
  }, [currentVehicleId]);

  // Lọc lịch sử chi phí theo phương tiện hiện hành được chọn
  const activeExpenses = useMemo(() => {
    if (!expenses || !currentVehicleId) return [];
    return expenses.filter(log => log.vehicleId === parseInt(currentVehicleId));
  }, [expenses, currentVehicleId]);

  // Hàm chuyển YYYY-MM-DD sang DD/MM/YYYY
  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Nén ảnh bằng canvas trước khi lưu vào IndexedDB
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId || !amount || !category) {
      alert('Vui lòng điền các trường bắt buộc');
      return;
    }

    const data = {
      vehicleId: parseInt(vehicleId),
      date,
      category,
      amount: parseFloat(amount),
      odometer: odometer ? parseInt(odometer) : null,
      notes,
      image
    };

    try {
      if (editingId) {
        await db.expenses.update(editingId, data);
        setEditingId(null);
      } else {
        await db.expenses.add(data);
      }

      // Reset form
      setAmount('');
      setOdometer('');
      setNotes('');
      setImage(null);
      setCategory(CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setExpandForm(false);
    } catch (err) {
      console.error('Error saving expense log:', err);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setVehicleId(log.vehicleId.toString());
    setDate(log.date);
    setCategory(log.category);
    setAmount(log.amount.toString());
    setOdometer(log.odometer ? log.odometer.toString() : '');
    setNotes(log.notes || '');
    setImage(log.image || null);
    setExpandForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      await db.expenses.delete(id);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      {/* Form Card (Cam/Đỏ) */}
      {expandForm ? (
        <div className="glass-card rounded-3xl p-6 animate-fade-in border-rose-500/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wrench className="text-rose-500 w-6 h-6" />
              {editingId ? 'Sửa chi phí xe' : 'Ghi nhận chi phí xe'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setExpandForm(false);
                setEditingId(null);
              }}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Đóng form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Danh mục *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Ngày chi *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateToDisplay(date)}
                    onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}
                    className="glass-input !pl-10 w-full cursor-pointer text-left focus:border-rose-500 focus:ring-rose-500/20"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Số tiền (VND) *</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="number"
                    placeholder="Ví dụ: 150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="glass-input !pl-9 w-full focus:border-rose-500 focus:ring-rose-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Chỉ số ODO (km - tùy chọn)</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                  <input
                    type="number"
                    placeholder="Ví dụ: 12050"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="glass-input !pl-10 w-full focus:border-rose-500 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Chọn / Chụp ảnh */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Ảnh hóa đơn/Biên lai (chụp/chọn file)</label>
              {image ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-slate-300 hover:text-rose-500 transition"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="expense-photo"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="expense-photo"
                    className="w-full h-16 bg-slate-900/60 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition"
                  >
                    <Camera className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-semibold">Chụp ảnh hóa đơn / Chọn ảnh</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-400 font-medium mb-1 pl-1">Ghi chú</label>
              <textarea
                placeholder="Chi tiết chi phí (VD: Thay dầu nhớt Castrol, lọc gió)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input h-20 resize-none focus:border-rose-500 focus:ring-rose-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {editingId ? 'Lưu thay đổi' : 'Ghi nhận chi phí'}
            </button>
          </form>
        </div>
      ) : (
        /* Nút thêm mới */
        <button
          onClick={() => setExpandForm(true)}
          className="w-full bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all duration-100 animate-fade-in"
        >
          <PlusCircle className="w-5 h-5" />
          Thêm chi phí xe mới
        </button>
      )}

      {/* Expense History List */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <h3 className="text-lg font-bold mb-4">Chi phí khác</h3>
        <div className="space-y-3">
          {activeExpenses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có chi phí nào của xe này được ghi lại</p>
          ) : (
            activeExpenses.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex justify-between items-center hover:border-slate-700 transition"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-rose-950/40 text-rose-400 border border-rose-900/30 font-medium px-2 py-0.5 rounded-lg text-xs">
                      {log.category}
                    </span>
                    <span className="font-semibold text-slate-100 text-sm">
                      {log.amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 flex gap-3">
                    <span>{formatDateToDisplay(log.date)}</span>
                    {log.odometer && <span>• ODO: {log.odometer.toLocaleString('vi-VN')} km</span>}
                  </div>
                  {log.notes && (
                    <p className="text-xs italic text-slate-500 mt-1 bg-slate-950/40 p-1.5 px-2 rounded-md truncate">
                      {log.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {log.image && (
                    <button
                      onClick={() => setZoomedImage(log.image)}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center hover:opacity-85 transition cursor-zoom-in"
                      title="Xem ảnh hóa đơn"
                    >
                      <img src={log.image} alt="Hóa đơn" className="w-full h-full object-cover" />
                    </button>
                  )}

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleEdit(log)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Zoom Ảnh */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full glass-card border border-slate-800 p-3 rounded-3xl flex flex-col items-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 hover:text-rose-500 transition shadow-lg"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <img src={zoomedImage} alt="Hóa đơn phóng to" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 uppercase font-semibold">Ảnh hóa đơn đã lưu</p>
          </div>
        </div>
      )}
    </div>
  );
}
