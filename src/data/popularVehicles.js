// Cơ sở dữ liệu toàn diện các dòng xe máy và ô tô phổ thông tại Việt Nam kèm dung tích bình xăng chuẩn
export const POPULAR_VEHICLES = [
  // ==========================================
  // 1. HONDA XE MÁY
  // ==========================================
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
    aliases: ['air blade', 'airblade', 'ab', 'ab 125', 'ab 160', 'air blade 125', 'air blade 160', 'ab125', 'ab160']
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
    aliases: ['sh', 'sh 125', 'sh 150', 'sh 160', 'sh 125i', 'sh 150i', 'sh 160i', 'honda sh', 'sh viet']
  },
  {
    name: 'Honda SH Mode',
    type: 'Motorcycle',
    tankCapacity: 5.6,
    aliases: ['sh mode', 'shmode', 'honda sh mode']
  },
  {
    name: 'Honda SH 350i / 300i',
    type: 'Motorcycle',
    tankCapacity: 9.3,
    aliases: ['sh 350', 'sh 350i', 'sh350', 'sh 300', 'sh 300i']
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
    name: 'Honda Dream / Super Dream',
    type: 'Motorcycle',
    tankCapacity: 3.7,
    aliases: ['dream', 'super dream', 'honda dream', 'dream thai', 'dream viet']
  },
  {
    name: 'Honda Super Cub / Cub 50 / Cub 125',
    type: 'Motorcycle',
    tankCapacity: 3.7,
    aliases: ['cub', 'cub 50', 'cub 125', 'super cub', 'honda cub']
  },
  {
    name: 'Honda Vario 125 / 160',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['vario', 'vario 125', 'vario 150', 'vario 160', 'honda vario']
  },
  {
    name: 'Honda Click 110 / 125 / 160',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['click', 'click 125', 'click 150', 'click 160', 'click thai', 'honda click']
  },
  {
    name: 'Honda Scoopy',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['scoopy', 'honda scoopy', 'scoopy 110', 'xe scoopy']
  },
  {
    name: 'Honda PCX 125 / 150 / 160',
    type: 'Motorcycle',
    tankCapacity: 8.1,
    aliases: ['pcx', 'pcx 125', 'pcx 150', 'pcx 160', 'honda pcx']
  },
  {
    name: 'Honda ADV 150 / ADV 160',
    type: 'Motorcycle',
    tankCapacity: 8.1,
    aliases: ['adv', 'adv 150', 'adv 160', 'honda adv']
  },
  {
    name: 'Honda Spacy 125',
    type: 'Motorcycle',
    tankCapacity: 5.2,
    aliases: ['spacy', 'spacy 125', 'honda spacy']
  },
  {
    name: 'Honda CBR150R',
    type: 'Motorcycle',
    tankCapacity: 12.0,
    aliases: ['cbr', 'cbr150', 'cbr150r', 'honda cbr']
  },
  {
    name: 'Honda CB150R / CB300R',
    type: 'Motorcycle',
    tankCapacity: 8.5,
    aliases: ['cb150r', 'cb300r', 'cb150', 'honda cb150r', 'neo sports cafe']
  },

  // ==========================================
  // 2. YAMAHA XE MÁY
  // ==========================================
  {
    name: 'Yamaha Exciter 155 VVA',
    type: 'Motorcycle',
    tankCapacity: 5.4,
    aliases: ['exciter 155', 'ex 155', 'ex155', 'exciter', 'yamaha exciter']
  },
  {
    name: 'Yamaha Exciter 150',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['exciter 150', 'ex 150', 'ex150', 'exciter']
  },
  {
    name: 'Yamaha Exciter 135',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['exciter 135', 'ex 135', 'ex 2010', 'ex 2011']
  },
  {
    name: 'Yamaha PG-1',
    type: 'Motorcycle',
    tankCapacity: 5.1,
    aliases: ['pg-1', 'pg1', 'yamaha pg1', 'yamaha pg-1']
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
    aliases: ['nvx', 'nvx 155', 'yamaha nvx', 'nvx155']
  },
  {
    name: 'Yamaha Sirius / Sirius Fi',
    type: 'Motorcycle',
    tankCapacity: 3.8,
    aliases: ['sirius', 'si fi', 'sirius fi', 'yamaha sirius', 'si']
  },
  {
    name: 'Yamaha Jupiter / Finn',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['jupiter', 'jupiter finn', 'finn', 'yamaha finn', 'ju']
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
  {
    name: 'Yamaha Nouvo (SX/RC/1-6)',
    type: 'Motorcycle',
    tankCapacity: 4.3,
    aliases: ['nouvo', 'nouvo sx', 'nouvo lx', 'nouvo 4', 'nouvo 5', 'nouvo 6']
  },
  {
    name: 'Yamaha Acruzo',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['acruzo', 'yamaha acruzo']
  },
  {
    name: 'Yamaha Mio / Classico / Mio M3',
    type: 'Motorcycle',
    tankCapacity: 4.2,
    aliases: ['mio', 'mio m3', 'mio classico', 'yamaha mio']
  },
  {
    name: 'Yamaha R15 (V3/V4)',
    type: 'Motorcycle',
    tankCapacity: 11.0,
    aliases: ['r15', 'r15 v3', 'r15 v4', 'yamaha r15']
  },
  {
    name: 'Yamaha MT-15',
    type: 'Motorcycle',
    tankCapacity: 10.0,
    aliases: ['mt15', 'mt-15', 'yamaha mt15']
  },
  {
    name: 'Yamaha FZ150i / TFX 150',
    type: 'Motorcycle',
    tankCapacity: 11.0,
    aliases: ['fz150i', 'fz150', 'tfx', 'tfx 150', 'yamaha fz']
  },
  {
    name: 'Yamaha XS155R',
    type: 'Motorcycle',
    tankCapacity: 10.0,
    aliases: ['xs155r', 'xs155', 'yamaha xs155r']
  },

  // ==========================================
  // 3. PIAGGIO & VESPA
  // ==========================================
  {
    name: 'Vespa Sprint 125 / 150',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['vespa sprint', 'sprint', 'vespa', 'sprint 125', 'sprint 150']
  },
  {
    name: 'Vespa Primavera 125',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['vespa primavera', 'primavera']
  },
  {
    name: 'Vespa GTS 125 / 150 / 300',
    type: 'Motorcycle',
    tankCapacity: 8.5,
    aliases: ['vespa gts', 'gts', 'gts 150', 'gts 300', 'gts 125']
  },
  {
    name: 'Vespa LX 125 / 150',
    type: 'Motorcycle',
    tankCapacity: 8.2,
    aliases: ['vespa lx', 'lx 125', 'lx', 'vespa lx 125', 'lx 150']
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
    name: 'Piaggio Zip 100',
    type: 'Motorcycle',
    tankCapacity: 7.0,
    aliases: ['zip', 'piaggio zip', 'zip 100']
  },
  {
    name: 'Piaggio Fly 125',
    type: 'Motorcycle',
    tankCapacity: 6.5,
    aliases: ['fly', 'piaggio fly', 'fly 125']
  },

  // ==========================================
  // 4. SUZUKI & SYM XE MÁY
  // ==========================================
  {
    name: 'Suzuki Raider R150 / Satria F150',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['raider', 'satria', 'raider 150', 'satria 150', 'suzuki raider']
  },
  {
    name: 'Suzuki Hayate 125',
    type: 'Motorcycle',
    tankCapacity: 4.7,
    aliases: ['hayate', 'suzuki hayate', 'hayate 125']
  },
  {
    name: 'Suzuki Impulse 125',
    type: 'Motorcycle',
    tankCapacity: 5.0,
    aliases: ['impulse', 'suzuki impulse']
  },
  {
    name: 'Suzuki Burgman Street 125',
    type: 'Motorcycle',
    tankCapacity: 5.5,
    aliases: ['burgman', 'suzuki burgman']
  },
  {
    name: 'Suzuki Viva 110 / Viva Fi',
    type: 'Motorcycle',
    tankCapacity: 3.7,
    aliases: ['viva', 'viva fi', 'suzuki viva', 'viva 110']
  },
  {
    name: 'Suzuki Axelo 125',
    type: 'Motorcycle',
    tankCapacity: 4.3,
    aliases: ['axelo', 'axelo 125', 'suzuki axelo']
  },
  {
    name: 'Suzuki GSX-R150 / GSX-S150 / Bandit',
    type: 'Motorcycle',
    tankCapacity: 11.0,
    aliases: ['gsx', 'gsx r150', 'gsx s150', 'bandit', 'gsx150']
  },
  {
    name: 'SYM Attila / Elizabeth',
    type: 'Motorcycle',
    tankCapacity: 5.0,
    aliases: ['attila', 'elizabeth', 'attila passing', 'sym attila']
  },
  {
    name: 'SYM Elegant 50 / Shark 50',
    type: 'Motorcycle',
    tankCapacity: 4.0,
    aliases: ['elegant', 'sym 50', 'shark 50', 'sym elegant', 'shark']
  },
  {
    name: 'SYM Star SR 125 / 170',
    type: 'Motorcycle',
    tankCapacity: 6.5,
    aliases: ['star sr', 'sym star', 'star 125', 'star 170']
  },

  // ==========================================
  // 5. Ô TÔ - CUV & B/C-SUV (Đô thị & Cỡ trung)
  // ==========================================
  {
    name: 'Mitsubishi Xforce',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['xforce', 'mitsubishi xforce', 'x force']
  },
  {
    name: 'Mazda CX-5',
    type: 'Car',
    tankCapacity: 56.0,
    aliases: ['cx5', 'cx-5', 'mazda cx5']
  },
  {
    name: 'Toyota Yaris Cross',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['yaris cross', 'toyota yaris cross']
  },
  {
    name: 'Toyota Corolla Cross',
    type: 'Car',
    tankCapacity: 47.0,
    aliases: ['corolla cross', 'cross', 'toyota cross']
  },
  {
    name: 'Toyota Raize',
    type: 'Car',
    tankCapacity: 36.0,
    aliases: ['raize', 'toyota raize']
  },
  {
    name: 'Hyundai Creta',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['creta', 'hyundai creta']
  },
  {
    name: 'Hyundai Venue',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['venue', 'hyundai venue']
  },
  {
    name: 'Hyundai Tucson',
    type: 'Car',
    tankCapacity: 54.0,
    aliases: ['tucson', 'hyundai tucson']
  },
  {
    name: 'Kia Seltos',
    type: 'Car',
    tankCapacity: 50.0,
    aliases: ['seltos', 'kia seltos']
  },
  {
    name: 'Kia Sonet',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['sonet', 'kia sonet']
  },
  {
    name: 'Kia Sportage',
    type: 'Car',
    tankCapacity: 54.0,
    aliases: ['sportage', 'kia sportage']
  },
  {
    name: 'Ford Territory',
    type: 'Car',
    tankCapacity: 60.0,
    aliases: ['territory', 'ford territory']
  },
  {
    name: 'Ford EcoSport',
    type: 'Car',
    tankCapacity: 52.0,
    aliases: ['ecosport', 'eco sport', 'ford ecosport']
  },
  {
    name: 'Honda CR-V',
    type: 'Car',
    tankCapacity: 53.0,
    aliases: ['crv', 'cr-v', 'honda crv', 'honda cr-v']
  },
  {
    name: 'Honda HR-V',
    type: 'Car',
    tankCapacity: 50.0,
    aliases: ['hrv', 'hr-v', 'honda hrv', 'honda hr-v']
  },
  {
    name: 'Mitsubishi Outlander',
    type: 'Car',
    tankCapacity: 60.0,
    aliases: ['outlander', 'mitsubishi outlander']
  },
  {
    name: 'Mazda CX-3',
    type: 'Car',
    tankCapacity: 48.0,
    aliases: ['cx3', 'cx-3', 'mazda cx3']
  },
  {
    name: 'Mazda CX-30',
    type: 'Car',
    tankCapacity: 51.0,
    aliases: ['cx30', 'cx-30', 'mazda cx30']
  },
  {
    name: 'Subaru Forester',
    type: 'Car',
    tankCapacity: 63.0,
    aliases: ['forester', 'subaru forester', 'subaru']
  },
  {
    name: 'Nissan Kicks e-Power',
    type: 'Car',
    tankCapacity: 41.0,
    aliases: ['kicks', 'nissan kicks', 'kicks e-power']
  },
  {
    name: 'Nissan X-Trail',
    type: 'Car',
    tankCapacity: 60.0,
    aliases: ['xtrail', 'x-trail', 'nissan xtrail']
  },
  {
    name: 'Peugeot 2008',
    type: 'Car',
    tankCapacity: 44.0,
    aliases: ['peugeot 2008', '2008']
  },
  {
    name: 'Peugeot 3008 / 5008',
    type: 'Car',
    tankCapacity: 53.0,
    aliases: ['peugeot 3008', 'peugeot 5008', '3008', '5008']
  },
  {
    name: 'Suzuki Jimny',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['jimny', 'suzuki jimny']
  },

  // ==========================================
  // 6. Ô TÔ - D-SUV & E-SUV (7 chỗ cỡ lớn & Khung gầm rời)
  // ==========================================
  {
    name: 'Mitsubishi Pajero Sport',
    type: 'Car',
    tankCapacity: 68.0,
    aliases: ['pajero sport', 'pajero', 'pajerosport', 'mitsubishi pajero sport', 'mitsubishi pajero']
  },
  {
    name: 'Mitsubishi Pajero',
    type: 'Car',
    tankCapacity: 88.0,
    aliases: ['pajero', 'mitsubishi pajero', 'pajero v6', 'pajero 3.0']
  },
  {
    name: 'Ford Everest',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['everest', 'ford everest']
  },
  {
    name: 'Ford Explorer',
    type: 'Car',
    tankCapacity: 70.0,
    aliases: ['explorer', 'ford explorer']
  },
  {
    name: 'Hyundai Santa Fe',
    type: 'Car',
    tankCapacity: 67.0,
    aliases: ['santafe', 'santa fe', 'hyundai santafe']
  },
  {
    name: 'Hyundai Palisade',
    type: 'Car',
    tankCapacity: 71.0,
    aliases: ['palisade', 'hyundai palisade']
  },
  {
    name: 'Toyota Fortuner',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['fortuner', 'toyota fortuner']
  },
  {
    name: 'Toyota Land Cruiser Prado',
    type: 'Car',
    tankCapacity: 87.0,
    aliases: ['prado', 'land cruiser prado', 'toyota prado']
  },
  {
    name: 'Toyota Land Cruiser (LC200 / LC300)',
    type: 'Car',
    tankCapacity: 110.0,
    aliases: ['land cruiser', 'lc300', 'lc200', 'toyota land cruiser']
  },
  {
    name: 'Mazda CX-8',
    type: 'Car',
    tankCapacity: 72.0,
    aliases: ['cx8', 'cx-8', 'mazda cx8']
  },
  {
    name: 'Kia Sorento',
    type: 'Car',
    tankCapacity: 67.0,
    aliases: ['sorento', 'kia sorento']
  },
  {
    name: 'Isuzu mu-X',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['mux', 'mu-x', 'isuzu mux', 'isuzu mu-x']
  },
  {
    name: 'Nissan Terra',
    type: 'Car',
    tankCapacity: 78.0,
    aliases: ['terra', 'nissan terra']
  },
  {
    name: 'VinFast Lux SA2.0',
    type: 'Car',
    tankCapacity: 85.0,
    aliases: ['lux sa', 'lux sa2.0', 'vinfast lux sa', 'lux sa 2.0']
  },

  // ==========================================
  // 7. Ô TÔ - MPV (Gia đình & Dịch vụ 7 - 16 chỗ)
  // ==========================================
  {
    name: 'Mitsubishi Xpander / Xpander Cross',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['xpander', 'xpander cross', 'mitsubishi xpander']
  },
  {
    name: 'Toyota Veloz Cross',
    type: 'Car',
    tankCapacity: 43.0,
    aliases: ['veloz', 'veloz cross', 'toyota veloz']
  },
  {
    name: 'Toyota Avanza Premio',
    type: 'Car',
    tankCapacity: 43.0,
    aliases: ['avanza', 'avanza premio']
  },
  {
    name: 'Toyota Innova Cross / Innova',
    type: 'Car',
    tankCapacity: 52.0,
    aliases: ['innova', 'innova cross', 'toyota innova']
  },
  {
    name: 'Honda BR-V',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['brv', 'br-v', 'honda brv']
  },
  {
    name: 'Hyundai Stargazer',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['stargazer', 'hyundai stargazer']
  },
  {
    name: 'Hyundai Custin',
    type: 'Car',
    tankCapacity: 58.0,
    aliases: ['custin', 'hyundai custin']
  },
  {
    name: 'Kia Carnival / Sedona',
    type: 'Car',
    tankCapacity: 72.0,
    aliases: ['carnival', 'kia carnival', 'sedona', 'kia sedona']
  },
  {
    name: 'Kia Carens',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['carens', 'kia carens']
  },
  {
    name: 'Suzuki XL7 / Hybrid',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['xl7', 'suzuki xl7', 'xl7 hybrid']
  },
  {
    name: 'Suzuki Ertiga / Hybrid',
    type: 'Car',
    tankCapacity: 45.0,
    aliases: ['ertiga', 'suzuki ertiga', 'ertiga hybrid']
  },
  {
    name: 'Ford Transit (16 chỗ)',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['transit', 'ford transit', 'xe 16 cho']
  },
  {
    name: 'Hyundai Solati (16 chỗ)',
    type: 'Car',
    tankCapacity: 75.0,
    aliases: ['solati', 'hyundai solati']
  },

  // ==========================================
  // 8. Ô TÔ - BÁN TẢI (PICK-UP) & XE TẢI NHẸ
  // ==========================================
  {
    name: 'Ford Ranger / Raptor',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['ranger', 'ford ranger', 'raptor', 'ban tai', 'ranger raptor']
  },
  {
    name: 'Mitsubishi Triton',
    type: 'Car',
    tankCapacity: 75.0,
    aliases: ['triton', 'mitsubishi triton']
  },
  {
    name: 'Toyota Hilux',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['hilux', 'toyota hilux']
  },
  {
    name: 'Isuzu D-Max',
    type: 'Car',
    tankCapacity: 76.0,
    aliases: ['dmax', 'd-max', 'isuzu dmax']
  },
  {
    name: 'Nissan Navara',
    type: 'Car',
    tankCapacity: 80.0,
    aliases: ['navara', 'nissan navara']
  },
  {
    name: 'Mazda BT-50',
    type: 'Car',
    tankCapacity: 76.0,
    aliases: ['bt50', 'bt-50', 'mazda bt50']
  },
  {
    name: 'Suzuki Super Carry / Carry Pro / Blind Van',
    type: 'Car',
    tankCapacity: 43.0,
    aliases: ['carry', 'carry pro', 'tai coc', 'suzuki carry', 'blind van', 'suzuki 5 ta', 'suzuki 7 ta']
  },

  // ==========================================
  // 9. Ô TÔ - SEDAN & HATCHBACK (Hạng A, B, C, D, E)
  // ==========================================
  {
    name: 'Toyota Vios',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['vios', 'toyota vios']
  },
  {
    name: 'Toyota Wigo',
    type: 'Car',
    tankCapacity: 33.0,
    aliases: ['wigo', 'toyota wigo']
  },
  {
    name: 'Toyota Yaris',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['yaris', 'toyota yaris']
  },
  {
    name: 'Toyota Corolla Altis',
    type: 'Car',
    tankCapacity: 50.0,
    aliases: ['altis', 'corolla altis', 'toyota altis']
  },
  {
    name: 'Toyota Camry',
    type: 'Car',
    tankCapacity: 60.0,
    aliases: ['camry', 'toyota camry']
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
    name: 'Hyundai Elantra',
    type: 'Car',
    tankCapacity: 47.0,
    aliases: ['elantra', 'hyundai elantra']
  },
  {
    name: 'Honda City',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['city', 'honda city']
  },
  {
    name: 'Honda Brio',
    type: 'Car',
    tankCapacity: 35.0,
    aliases: ['brio', 'honda brio']
  },
  {
    name: 'Honda Civic',
    type: 'Car',
    tankCapacity: 47.0,
    aliases: ['civic', 'honda civic']
  },
  {
    name: 'Honda Accord',
    type: 'Car',
    tankCapacity: 56.0,
    aliases: ['accord', 'honda accord']
  },
  {
    name: 'Mazda 2',
    type: 'Car',
    tankCapacity: 44.0,
    aliases: ['mazda 2', 'mazda2']
  },
  {
    name: 'Mazda 3',
    type: 'Car',
    tankCapacity: 51.0,
    aliases: ['mazda 3', 'mazda3']
  },
  {
    name: 'Mazda 6',
    type: 'Car',
    tankCapacity: 62.0,
    aliases: ['mazda 6', 'mazda6']
  },
  {
    name: 'Kia Morning',
    type: 'Car',
    tankCapacity: 35.0,
    aliases: ['morning', 'kia morning']
  },
  {
    name: 'Kia Soluto',
    type: 'Car',
    tankCapacity: 43.0,
    aliases: ['soluto', 'kia soluto']
  },
  {
    name: 'Kia K3 / Cerato',
    type: 'Car',
    tankCapacity: 50.0,
    aliases: ['k3', 'cerato', 'kia k3', 'kia cerato']
  },
  {
    name: 'Kia K5 / Optima',
    type: 'Car',
    tankCapacity: 60.0,
    aliases: ['k5', 'optima', 'kia k5', 'kia optima']
  },
  {
    name: 'Mitsubishi Attrage',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['attrage', 'mitsubishi attrage']
  },
  {
    name: 'Suzuki Swift',
    type: 'Car',
    tankCapacity: 37.0,
    aliases: ['swift', 'suzuki swift']
  },
  {
    name: 'Suzuki Ciaz',
    type: 'Car',
    tankCapacity: 42.0,
    aliases: ['ciaz', 'suzuki ciaz']
  },
  {
    name: 'Nissan Almera / Sunny',
    type: 'Car',
    tankCapacity: 40.0,
    aliases: ['almera', 'sunny', 'nissan almera', 'nissan sunny']
  },
  {
    name: 'VinFast Fadil',
    type: 'Car',
    tankCapacity: 32.0,
    aliases: ['fadil', 'vinfast fadil']
  },
  {
    name: 'VinFast Lux A2.0',
    type: 'Car',
    tankCapacity: 70.0,
    aliases: ['lux a', 'lux a2.0', 'vinfast lux a', 'lux a 2.0']
  },

  // ==========================================
  // 10. Ô TÔ HẠNG SANG PHỔ BIẾN TẠI VIỆT NAM
  // ==========================================
  {
    name: 'Mercedes-Benz C-Class (C200 / C300)',
    type: 'Car',
    tankCapacity: 66.0,
    aliases: ['mercedes c', 'c200', 'c300', 'mercedes c200', 'mercedes c300', 'c-class', 'mec c']
  },
  {
    name: 'Mercedes-Benz E-Class (E200 / E300)',
    type: 'Car',
    tankCapacity: 66.0,
    aliases: ['mercedes e', 'e200', 'e300', 'mercedes e200', 'mercedes e300', 'e-class', 'mec e']
  },
  {
    name: 'Mercedes-Benz GLC (GLC 200 / GLC 300)',
    type: 'Car',
    tankCapacity: 66.0,
    aliases: ['glc', 'glc 200', 'glc 300', 'mercedes glc', 'glc200', 'glc300', 'glc 4matic', 'mec glc']
  },
  {
    name: 'BMW 3 Series (320i / 330i)',
    type: 'Car',
    tankCapacity: 59.0,
    aliases: ['bmw 3', 'bmw 320i', 'bmw 330i', '320i', '330i', 'bmw 3 series']
  },
  {
    name: 'BMW 5 Series (520i / 530i)',
    type: 'Car',
    tankCapacity: 68.0,
    aliases: ['bmw 5', 'bmw 520i', 'bmw 530i', '520i', '530i', 'bmw 5 series']
  },
  {
    name: 'Lexus RX (RX350 / RX300 / RX500h)',
    type: 'Car',
    tankCapacity: 65.0,
    aliases: ['lexus rx', 'rx350', 'rx300', 'rx 350', 'lexus rx350', 'rx350h']
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
  { label: 'PG-1 (5.1L)', name: 'Yamaha PG-1', type: 'Motorcycle', tankCapacity: 5.1 },
  { label: 'Wave Alpha (3.7L)', name: 'Honda Wave Alpha', type: 'Motorcycle', tankCapacity: 3.7 },
  { label: 'Vios (42L)', name: 'Toyota Vios', type: 'Car', tankCapacity: 42.0 },
  { label: 'Xforce (42L)', name: 'Mitsubishi Xforce', type: 'Car', tankCapacity: 42.0 },
  { label: 'Xpander (45L)', name: 'Mitsubishi Xpander / Xpander Cross', type: 'Car', tankCapacity: 45.0 },
  { label: 'Ranger (80L)', name: 'Ford Ranger / Raptor', type: 'Car', tankCapacity: 80.0 },
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
export function searchVehicles(keyword, limit = 8) {
  if (!keyword || typeof keyword !== 'string') return [];
  const cleanKeyword = removeVietnameseTones(keyword);
  if (!cleanKeyword) return [];

  const keywordWords = cleanKeyword.split(/\s+/);
  const results = [];

  for (const v of POPULAR_VEHICLES) {
    const cleanName = removeVietnameseTones(v.name);
    
    // Kiểm tra khớp trực tiếp trong tên (từ khóa ngắn <= 2 ký tự chỉ khớp đầu từ)
    let isMatch = false;
    if (cleanKeyword.length <= 2) {
      const nameWords = cleanName.split(/[\s\-\/\.]+/);
      isMatch = nameWords.some(w => w.startsWith(cleanKeyword));
    } else {
      isMatch = cleanName.includes(cleanKeyword);
    }

    // Kiểm tra khớp trong aliases
    let aliasMatchStarts = false;
    if (!isMatch && v.aliases && v.aliases.length > 0) {
      isMatch = v.aliases.some(alias => {
        const cleanAlias = removeVietnameseTones(alias);
        if (cleanKeyword.length <= 2) {
          const aliasWords = cleanAlias.split(/[\s\-\/\.]+/);
          const match = aliasWords.some(w => w.startsWith(cleanKeyword)) || cleanAlias === cleanKeyword;
          if (match && cleanAlias.startsWith(cleanKeyword)) aliasMatchStarts = true;
          return match;
        }
        const match = cleanAlias.includes(cleanKeyword) || 
                      keywordWords.includes(cleanAlias) ||
                      (cleanAlias.length >= 3 && cleanKeyword.includes(cleanAlias));
        if (match && (cleanAlias.startsWith(cleanKeyword) || cleanKeyword.startsWith(cleanAlias))) {
          aliasMatchStarts = true;
        }
        return match;
      });
    }

    if (isMatch) {
      // Tính điểm ưu tiên: khớp đầu tên xe (3) > khớp đầu alias (2) > khớp bên trong (1)
      let priority = 1;
      if (cleanName.startsWith(cleanKeyword)) {
        priority = 3;
      } else if (aliasMatchStarts || (v.aliases && v.aliases.some(a => removeVietnameseTones(a).startsWith(cleanKeyword)))) {
        priority = 2;
      }
      results.push({ ...v, priority });
    }
  }

  // Sắp xếp theo độ ưu tiên
  results.sort((a, b) => b.priority - a.priority);

  return results.slice(0, limit);
}
