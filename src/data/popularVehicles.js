// Cơ sở dữ liệu các dòng xe máy và ô tô phổ thông tại Việt Nam kèm dung tích bình xăng chuẩn
export const POPULAR_VEHICLES = [
  // --- HONDA XE MÁY ---
  {
    name: 'Honda Winner X',
    type: 'Motorcycle',
    tankCapacity: 4.5,
    aliases: ['winner x', 'winnerx', 'winner', 'honda winner x']
  },
  {
    name: 'Honda Winner 150',
    type: 'Motorcycle',
    tankCapacity: 4.5,
    aliases: ['winner 150', 'winner v1', 'winner150', 'winner']
  },
  {
    name: 'Honda Vision',
    type: 'Motorcycle',
    tankCapacity: 4.9,
    aliases: ['vision', 'honda vision', 'xe vision']
  },
  {
    name: 'Honda Air Blade 125 / 160',
    type: 'Motorcycle',
    tankCapacity: 4.4,
    aliases: ['air blade', 'airblade', 'ab', 'ab 125', 'ab 160', 'air blade 125', 'air blade 160']
  },
  {
    name: 'Honda Lead 125',
    type: 'Motorcycle',
    tankCapacity: 6.0,
    aliases: ['lead', 'lead 125', 'honda lead', 'xe lead']
  },
  {
    name: 'Honda SH 125i / 150i / 160i',
    type: 'Motorcycle',
    tankCapacity: 7.8,
    aliases: ['sh', 'sh 125', 'sh 150', 'sh 160', 'sh 125i', 'sh 150i', 'sh 160i', 'honda sh']
  },
  {
    name: 'Honda SH Mode',
    type: 'Motorcycle',
    tankCapacity: 5.6,
    aliases: ['sh mode', 'shmode', 'honda sh mode']
  },
  {
    name: 'Honda SH 350i',
    type: 'Motorcycle',
    tankCapacity: 9.3,
    aliases: ['sh 350', 'sh 350i', 'sh350']
  },
  {
    name: 'Honda Wave Alpha',
    type: 'Motorcycle',
    tankCapacity: 3.7,
    aliases: ['wave alpha', 'wave a', 'wave', 'honda wave']
  },
  {
    name: 'Honda Wave RSX',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['wave rsx', 'rsx', 'wave fi', 'wave rsx fi']
  },
  {
    name: 'Honda Future 125 Fi',
    type: 'Motorcycle',
    tankCapacity: 4.6,
    aliases: ['future', 'future 125', 'fu 125', 'fu neo', 'honda future']
  },
  {
    name: 'Honda Blade 110',
    type: 'Motorcycle',
    tankCapacity: 3.7,
    aliases: ['blade', 'blade 110', 'honda blade']
  },
  {
    name: 'Honda Vario 125 / 160',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['vario', 'vario 125', 'vario 160', 'honda vario']
  },
  {
    name: 'Honda PCX 160',
    type: 'Motorcycle',
    tankCapacity: 8.1,
    aliases: ['pcx', 'pcx 125', 'pcx 150', 'pcx 160', 'honda pcx']
  },

  // --- YAMAHA XE MÁY ---
  {
    name: 'Yamaha Exciter 155 VVA',
    type: 'Motorcycle',
    tankCapacity: 5.4,
    aliases: ['exciter 155', 'ex 155', 'ex155', 'exciter', 'ex']
  },
  {
    name: 'Yamaha Exciter 150',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['exciter 150', 'ex 150', 'ex150', 'exciter', 'ex']
  },
  {
    name: 'Yamaha Exciter 135',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['exciter 135', 'ex 135', 'ex135', 'ex 4 so', 'ex 5 so']
  },
  {
    name: 'Yamaha Grande',
    type: 'Motorcycle',
    tankCapacity: 4.4,
    aliases: ['grande', 'yamaha grande', 'xe grande']
  },
  {
    name: 'Yamaha Janus',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['janus', 'yamaha janus', 'xe janus']
  },
  {
    name: 'Yamaha NVX 155',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['nvx', 'nvx 155', 'yamaha nvx']
  },
  {
    name: 'Yamaha Sirius / Sirius Fi',
    type: 'Motorcycle',
    tankCapacity: 3.8,
    aliases: ['sirius', 'si fi', 'sirius fi', 'yamaha sirius']
  },
  {
    name: 'Yamaha Jupiter / Finn',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['jupiter', 'jupiter finn', 'finn', 'yamaha finn']
  },
  {
    name: 'Yamaha Latte',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['latte', 'yamaha latte']
  },
  {
    name: 'Yamaha FreeGo',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['freego', 'yamaha freego']
  },

  // --- PIAGGIO / VESPA & SUZUKI ---
  {
    name: 'Vespa Sprint 125',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['vespa sprint', 'sprint', 'vespa']
  },
  {
    name: 'Vespa Primavera 125',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['vespa primavera', 'primavera']
  },
  {
    name: 'Piaggio Liberty 125',
    type: 'Motorcycle',
    tankCapacity: 6.0,
    aliases: ['liberty', 'piaggio liberty', 'liberty 125']
  },
  {
    name: 'Piaggio Medley 125 / 150',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['medley', 'piaggio medley']
  },
  {
    name: 'Suzuki Raider R150 / Satria F150',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['raider', 'satria', 'raider 150', 'satria 150', 'suzuki raider', 'suzuki satria']
  },
  {
    name: 'Suzuki Burgman Street',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['burgman', 'burgman street', 'suzuki burgman']
  },

  // --- Ô TÔ THÔNG DỤNG ---
  {
    name: 'Toyota Vios',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['vios', 'toyota vios']
  },
  {
    name: 'Toyota Corolla Cross',
    type: 'Car',
    tankCapacity: 47.0,
    aliases: ['corolla cross', 'cross', 'toyota cross']
  },
  {
    name: 'Hyundai Accent',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['accent', 'hyundai accent']
  },
  {
    name: 'Hyundai Grand i10',
    type: 'Car',
    tankCapacity: 37.0,
    aliases: ['i10', 'grand i10', 'hyundai i10']
  },
  {
    name: 'Honda City',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['city', 'honda city']
  },
  {
    name: 'Mazda 3',
    type: 'Car',
    tankCapacity: 51.0,
    aliases: ['mazda 3', 'mazda3']
  },
  {
    name: 'Mazda CX-5',
    type: 'Car',
    tankCapacity: 56.0,
    aliases: ['cx5', 'cx-5', 'mazda cx5']
  },
  {
    name: 'Mitsubishi Xpander',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['xpander', 'mitsubishi xpander']
  },
  {
    name: 'Kia Morning',
    type: 'Car',
    tankCapacity: 35.0,
    aliases: ['morning', 'kia morning']
  },
  {
    name: 'VinFast Fadil',
    type: 'Car',
    tankCapacity: 32.0,
    aliases: ['fadil', 'vinfast fadil']
  },
  {
    name: 'Ford Ranger',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['ranger', 'ford ranger', 'ban tai']
  }
];

// Danh sách các xe phổ biến nhất để hiển thị hàng Quick Chips
export const QUICK_POPULAR_VEHICLES = [
  { label: 'Vision (4.9L)', name: 'Honda Vision', type: 'Motorcycle', tankCapacity: 4.9 },
  { label: 'Air Blade (4.4L)', name: 'Honda Air Blade 125 / 160', type: 'Motorcycle', tankCapacity: 4.4 },
  { label: 'Lead (6.0L)', name: 'Honda Lead 125', type: 'Motorcycle', tankCapacity: 6.0 },
  { label: 'SH (7.8L)', name: 'Honda SH 125i / 150i / 160i', type: 'Motorcycle', tankCapacity: 7.8 },
  { label: 'Winner X (4.5L)', name: 'Honda Winner X', type: 'Motorcycle', tankCapacity: 4.5 },
  { label: 'Exciter (5.4L)', name: 'Yamaha Exciter 155 VVA', type: 'Motorcycle', tankCapacity: 5.4 },
  { label: 'Wave Alpha (3.7L)', name: 'Honda Wave Alpha', type: 'Motorcycle', tankCapacity: 3.7 },
  { label: 'Vios (42L)', name: 'Toyota Vios', type: 'Car', tankCapacity: 42.0 },
];

// Hàm khử dấu tiếng Việt để tìm kiếm không phụ thuộc dấu
export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Hàm tìm kiếm phương tiện theo từ khóa
export function searchVehicles(keyword, limit = 5) {
  if (!keyword || typeof keyword !== 'string') return [];
  const cleanKeyword = removeVietnameseTones(keyword);
  if (!cleanKeyword) return [];

  const results = [];

  for (const v of POPULAR_VEHICLES) {
    const cleanName = removeVietnameseTones(v.name);
    
    // Kiểm tra khớp trực tiếp trong tên
    let isMatch = cleanName.includes(cleanKeyword);

    // Kiểm tra khớp trong aliases
    if (!isMatch && v.aliases && v.aliases.length > 0) {
      isMatch = v.aliases.some(alias => {
        const cleanAlias = removeVietnameseTones(alias);
        return cleanAlias.includes(cleanKeyword) || cleanKeyword.includes(cleanAlias);
      });
    }

    if (isMatch) {
      // Tính điểm ưu tiên: khớp đầu chuỗi có điểm cao hơn
      const priority = cleanName.startsWith(cleanKeyword) ? 2 : 1;
      results.push({ ...v, priority });
    }
  }

  // Sắp xếp theo độ ưu tiên
  results.sort((a, b) => b.priority - a.priority);

  return results.slice(0, limit);
}
