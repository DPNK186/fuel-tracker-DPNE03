# Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi nhận tại đây.

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
