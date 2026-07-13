import Dexie from 'dexie';

export const db = new Dexie('FuelTrackerDB');

// Định nghĩa schema các bảng (chỉ khai báo khóa chính và các thuộc tính cần đánh chỉ mục)
db.version(1).stores({
  vehicles: '++id, name, type, plateNumber',
  refuelings: '++id, vehicleId, date, odometer, liters, pricePerLiter, totalCost, fullTank, fuelType',
  expenses: '++id, vehicleId, date, category, amount, odometer'
});

// Seed dữ liệu mẫu nếu database trống để người dùng dễ trải nghiệm
db.on('populate', async () => {
  const defaultVehicleId = await db.vehicles.add({
    name: 'Honda Vision',
    type: 'Motorcycle',
    plateNumber: '29A-123.45',
    tankCapacity: 5.2
  });

  const now = new Date();
  
  // Dữ liệu đổ xăng mẫu của xe máy (dung tích bình xăng ~5.2 Lít)
  await db.refuelings.bulkAdd([
    {
      vehicleId: defaultVehicleId,
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 ngày trước
      odometer: 12000,
      liters: 4.2,
      pricePerLiter: 23500,
      totalCost: 98700,
      fullTank: true,
      fuelType: 'E10 Ron 95',
      notes: 'Đổ xăng khởi đầu (Mốc tính tiêu hao)'
    },
    {
      vehicleId: defaultVehicleId,
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 ngày trước
      odometer: 12180, // Đi được 180 km
      liters: 4.5,
      pricePerLiter: 24000,
      totalCost: 108000,
      fullTank: true,
      fuelType: 'E10 Ron 95',
      notes: 'Đổ xăng đầy bình. Hiệu suất: 40 km/1L'
    },
    {
      vehicleId: defaultVehicleId,
      date: new Date().toISOString().split('T')[0], // Hôm nay
      odometer: 12350, // Đi thêm 170 km
      liters: 4.1,
      pricePerLiter: 23800,
      totalCost: 97580,
      fullTank: true,
      fuelType: 'E10 Ron 95',
      notes: 'Đổ xăng đầy bình. Hiệu suất: 41.46 km/1L'
    }
  ]);

  // Chi phí khác mẫu cho xe máy
  await db.expenses.bulkAdd([
    {
      vehicleId: defaultVehicleId,
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Bảo dưỡng',
      amount: 135000,
      odometer: 12100,
      notes: 'Thay dầu nhớt động cơ Motul Gold',
      image: null // Chỗ chứa ảnh Base64
    },
    {
      vehicleId: defaultVehicleId,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Rửa xe',
      amount: 30000,
      odometer: 12250,
      notes: 'Rửa xe máy bọt tuyết sạch',
      image: null
    }
  ]);
});
