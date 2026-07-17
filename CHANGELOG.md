# Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi nhận tại đây.

## 🚀 [1.2.0] - 2026-07-17

### Add (Thêm mới)
- Tích hợp **Tính năng Tự động đồng bộ Google Drive ngầm (Background Auto Sync)**: Tự động chạy sao lưu dữ liệu lên đám mây ở chế độ ngầm sau mỗi thao tác thêm, sửa hoặc xóa dữ liệu (xe máy/ô tô, đổ xăng, chi phí khác).
- Thêm cơ chế **Tự động thử lại (Retry) thông minh**: Khi mất kết nối hoặc lỗi API, hệ thống sẽ tự động thử lại sau mỗi 10 giây hoặc ngay khi có kết nối mạng trở lại (sự kiện `online`) hoặc khi mở lại ứng dụng.
- Tích hợp cờ trạng thái chưa đồng bộ `google_drive_unsynced_changes` giúp lưu giữ các thay đổi cục bộ và tự động đồng bộ khi online trở lại.
- Thiết kế **Chỉ báo đồng bộ động (Dynamic Sync Badge)** sinh động ngoài Header:
  - Khi bắt đầu sync ngầm, biểu tượng Wifi online đổi thành biểu tượng 2 mũi tên xoay màu vàng (`RefreshCw` animate-spin) trong tối thiểu 1 giây.
  - Khi sync thành công, hiển thị biểu tượng đám mây kèm dấu check xanh (`Check`) trong 3 giây để thông báo trực quan trước khi đưa về trạng thái bình thường.
  - Khi sync lỗi, hiển thị biểu tượng đám mây kèm dấu `X` đỏ ("Lỗi Sync").
- Thiết lập cơ chế **Giải quyết Xung đột dữ liệu (Conflict Resolution)**:
  - So sánh `timestamp` của bản sao lưu đám mây với thiết bị local trước khi đồng bộ để phát hiện xung đột nếu người dùng dùng nhiều thiết bị.
  - Tự động tải bản mới từ đám mây xuống local (Auto-Restore) nếu local không có sửa đổi nào mới.
  - Hiển thị Modal Popup trực quan để người dùng xác nhận lựa chọn giữ bản Đám mây (ghi đè local) hoặc giữ bản Thiết bị (ghi đè đám mây) khi xảy ra xung đột thực sự.

### Changed (Thay đổi)
- Mở rộng tab Đồng bộ (`SyncBackup.jsx`): Bổ sung dòng hiển thị thời gian đồng bộ thành công gần nhất ("Đồng bộ lần cuối: DD/MM/YYYY HH:mm:ss") được cập nhật thời gian thực.
- Sử dụng chung hàm helper `importToDB()` được đóng gói tại `src/services/googleDrive.js` giúp làm sạch mã nguồn và đồng nhất quy trình nhập dữ liệu Dexie.

## 🚀 [1.1.4] - 2026-07-13

### Fixed (Sửa lỗi)
- Khắc phục lỗi chồng lấn giao diện (overlapping) khi hiển thị PWA Install Banner và PWA Update Toast/Offline Ready Toast cùng lúc tại `fixed bottom-[74px]`. Banner cài đặt sẽ tự động ẩn đi để ưu tiên hiển thị thông báo cập nhật quan trọng hơn.
- Tắt độ mờ (opacity) nền cho cả hai banner bằng cách chuyển màu nền từ bán trong suốt (`bg-slate-900/98`) thành màu đặc hoàn toàn (`bg-slate-900`), ngăn ngừa việc lộ nội dung rối mắt ở phía dưới khi chồng xếp.
- Khắc phục lỗi PWA Desktop Icon hiển thị chữ "X" mặc định bằng cách cấu hình kích thước icons chuẩn trong Web App Manifest.

### Changed (Thay đổi)
- Tối ưu hóa hiệu năng tải logo và favicon ban đầu bằng cách tạo các asset có độ phân giải thấp và dung lượng cực nhẹ từ ảnh gốc `Icon1.png` (nặng 1.7 MB):
  - [icon-128.png](file:///d:/AI-Fuel-Tracker/public/icon-128.png): kích thước 128x128px, dung lượng ~38 KB, dùng cho logo trong ứng dụng (Header).
  - [favicon-32.png](file:///d:/AI-Fuel-Tracker/public/favicon-32.png): kích thước 32x32px, dung lượng ~3.4 KB, dùng làm favicon cho trình duyệt.
  - [icon-192.png](file:///d:/AI-Fuel-Tracker/public/icon-192.png): kích thước 192x192px, dung lượng ~81 KB, dùng làm icon chuẩn của PWA.
  - [icon-512.png](file:///d:/AI-Fuel-Tracker/public/icon-512.png): kích thước 512x512px, dung lượng ~595 KB, dùng làm icon chuẩn của PWA.
- Cập nhật cấu hình PWA `includeAssets` trong `vite.config.js` để đưa tất cả các phiên bản icon mới vào danh sách precache tải ngoại tuyến của Service Worker.
- Thay đổi nhãn tiêu đề phụ trong Header từ "Offline-First App" sang "By ĐPNE03" để ghi nhận thông tin nhóm phát triển.

## 🚀 [1.1.3] - 2026-07-13

### Changed (Thay đổi)
- Đồng bộ và cập nhật hệ thống tài liệu hướng dẫn tại thư mục `docs/`:
  - [deployment.md](file:///d:/AI-Fuel-Tracker/docs/deployment.md): Bổ sung lưu ý về cơ chế nạp Client ID mặc định tự động khi deploy qua GitHub Actions.
  - [security.md](file:///d:/AI-Fuel-Tracker/docs/security.md): Làm rõ tính an toàn và bảo mật của việc thiết lập Client ID mặc định fallback (kết hợp với cơ chế Authorized Origins và Redirect URIs khóa miền).

## 🚀 [1.1.2] - 2026-07-13

### Fixed (Sửa lỗi)
- Cấu hình giá trị Client ID mặc định làm fallback cho biến `CLIENT_ID` trong `googleDriveService`. Việc này giải quyết lỗi trống biến cấu hình khi ứng dụng được tự động build và deploy từ GitHub Actions (môi trường không lưu trữ file `.env` vì lý do bảo mật).

## 🚀 [1.1.1] - 2026-07-13

### Add (Thêm mới)
- Thêm phần thông báo hướng dẫn xin cấp quyền truy cập (Access Instruction) khi trạng thái chưa kết nối Google Drive, bao gồm hộp thông tin chi tiết và nút "Gửi Email đăng ký" thông minh qua liên kết `mailto:dpn.e103a@gmail.com`.

### Changed (Thay đổi)
- Tối ưu hóa cơ chế dọn dẹp bộ nhớ đệm xác thực: Khi token Google Drive hết hạn, hệ thống sẽ phát tín hiệu đồng bộ bằng sự kiện tùy biến (`CustomEvent` mang tên `google-drive-logout`) giúp giao diện tự động chuyển trạng thái về "Chưa kết nối đám mây" ngay lập tức.

### Fixed (Sửa lỗi)
- Khắc phục nguy cơ crash ứng dụng do lỗi phản hồi mạng bằng hàm helper an toàn `parseErrorResponse`, đọc dữ liệu thô dạng văn bản (`text()`) trước khi parse JSON từ Google Drive API.

## 🚀 [1.1.0] - 2026-07-13

### Add (Thêm mới)
- Tích hợp **Popup Thông báo cập nhật PWA chủ động** (PWA Update Prompt): Tự động phát hiện phiên bản mới nhất trên server và hiển thị Toast nổi bật hỏi người dùng nhấp cập nhật tức thì.
- Thêm trường **Dung tích bình xăng (Lít)** khi tạo xe mới và bổ sung tính năng **Chỉnh sửa thông tin xe (Sửa xe)** ngay tại Modal quản lý phương tiện để cập nhật thông số an toàn, giữ nguyên vẹn dữ liệu lịch sử liên kết.
- Tích hợp hệ thống **Cảnh báo nhập liệu thông minh thời gian thực**:
  - Cảnh báo lượng xăng đổ vượt quá dung tích bình xăng thực tế của xe.
  - Cảnh báo quãng đường di chuyển giữa 2 lần đổ quá dài, tự động tính toán ngưỡng thích ứng dựa trên loại xe và dung tích bình xăng.
  - Cảnh báo chỉ số Odometer bị đảo lộn trình tự thời gian (nhập nhầm ODO).
  - Đánh dấu **Nhãn cảnh báo màu cam ⚠️** kèm lý do cụ thể trực tiếp bên cạnh dòng lịch sử bị cảnh báo.
- Thiết lập **Floating PWA Install Banner** thông minh: Tự động nhận diện thiết bị Android/Desktop để hiện nút cài đặt trực tiếp, nhận diện iOS để hướng dẫn nút Share Safari, kiểm tra trạng thái Standalone để tránh làm phiền và hỗ trợ cơ chế Snooze ẩn banner 7 ngày nếu bị đóng.

### Changed (Thay đổi)
- **Đồng bộ hóa Xe hiện hành**: Tên xe và icon loại xe (Xe máy `Bike` / Ô tô `Car`) hiển thị linh hoạt ngoài Header và lưu trữ ghi nhớ qua `localStorage`.
- **Bộ lọc đa phương tiện**: Toàn bộ đồ thị, phân tích chi tiêu trên Dashboard và danh sách Lịch sử đổ xăng / Chi phí khác sẽ được lọc hiển thị chính xác theo xe hiện hành đang chọn.
- **Thay đổi biểu tượng tiền tệ**: Đổi toàn bộ icon Dollar (`DollarSign`) cũ sang biểu tượng xấp đồng xu xếp chồng (`Coins`) tăng tính thẩm mỹ và thân thiện với tiền tệ Việt Nam.
- **Tối ưu hóa UI cuộn trang**: Chuyển đổi nền của Header và Bottom Tabbar sang màu đặc (**Solid bg-slate-900** 100%) để triệt tiêu lỗi chồng chữ khi cuộn trang dài.
- Tự động dọn dẹp xe mẫu "Honda Vision" mặc định và các dữ liệu liên kết mẫu khi người dùng thêm chiếc xe cá nhân thật đầu tiên.

### Fixed (Sửa lỗi)
- **Khắc phục lỗ hổng bảo mật**: Gỡ bỏ tệp tin cấu hình môi trường `.env` khỏi bộ nhớ đệm Git Tracking và thêm vào `.gitignore` để tránh rò rỉ Client ID khi repository chuyển sang chế độ Public.

## 🚀 [1.0.0] - 2026-07-13

### Add (Thêm mới)
- Khởi tạo dự án quản lý chi phí nhiên liệu **Xăng Xe** PWA Offline-First sử dụng React (Vite), Tailwind CSS và Dexie.js (IndexedDB).
- Thiết lập tính năng sao lưu và khôi phục dữ liệu tự động tích hợp **Google Drive API (AppData ẩn)** bảo mật cao.
- Thêm 2 nút hành động nhanh (Quick Action Buttons) trên trang chủ Dashboard để chuyển nhanh sang form Đổ xăng / Chi phí.
- Bổ sung dropdown lựa chọn Loại xăng (E10 Ron 95, E5 Ron 92, Diesel) và lưu trữ cùng lịch sử đổ xăng.
- Hỗ trợ tải ảnh/chụp ảnh biên lai chi phí trực tiếp qua Camera điện thoại, tự động nén kích thước bằng Canvas để lưu trữ IndexedDB tối ưu.
- Thiết kế nút tùy chỉnh và Native Datepicker ẩn, định dạng hiển thị ngày tiếng Việt chuẩn `DD/MM/YYYY`.

### Changed (Thay đổi)
- Đổi tên ứng dụng thành **Xăng Xe** và tích hợp logo PWA chính thức `Icon1.png`.
- Ưu tiên hiển thị danh sách Lịch sử lên đầu trang; thiết lập Form nhập liệu ở trạng thái thu gọn (Collapsible Form) giúp giao diện di động gọn gàng.
- Thay thế biểu đồ giá xăng bằng biểu đồ hiệu suất trung bình **km/L** trực quan.
- Chuyển đổi tông màu chủ đạo của menu Chi phí sang màu đỏ/cam để phân biệt trực quan với màu xanh lá của menu Đổ xăng.
- Cấu hình độ rộng container co giãn responsive (`w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto`) để giao diện hiển thị đẹp mắt trên cả mobile, tablet và desktop.

### Fixed (Sửa lỗi)
- Sửa lỗi đè Icon (Overlap) trong các ô nhập liệu bằng cách ép lề lách đè CSS class.
- Khắc phục lỗi `400 Bad Request` khi gọi Google Drive API bằng cách mã hóa URL (URL encoded) và cấu hình chuẩn cú pháp tìm kiếm `'appDataFolder' in parents`.
- Tích hợp Terser minify loại bỏ toàn bộ `console.log` và `debugger` trong bản đóng gói phát hành.
