# 🚗 Xăng Xe - Ứng dụng Quản lý Nhiên liệu & Chi phí (Offline-First PWA)

Ứng dụng di động (PWA) giúp bạn dễ dàng theo dõi chi phí đổ xăng, hiệu suất tiêu thụ nhiên liệu (km/L) và các chi phí vận hành xe khác một cách trực quan, mượt mà và hoàn toàn riêng tư.

👉 **Trải nghiệm ứng dụng trực tuyến tại:** [https://dpnk186.github.io/fuel-tracker-DPNE03/](https://dpnk186.github.io/fuel-tracker-DPNE03/)

---

## 🌟 Các tính năng nổi bật

* **Offline-First (Không cần mạng)**: Toàn bộ dữ liệu được lưu trữ trực tiếp trên thiết bị của bạn thông qua IndexedDB (Dexie.js). Ứng dụng hoạt động bình thường ngay cả khi bạn đi vào vùng không có sóng điện thoại.
* **Cài đặt như App di động (PWA)**: Hỗ trợ công nghệ Progressive Web App, cho phép bạn thêm phím tắt ứng dụng trực tiếp ra màn hình chính (Add to Home Screen) trên iPhone/Android để mở toàn màn hình tiện lợi.
* **Đồng bộ Google Drive bảo mật**:
  * Tự động sao lưu và khôi phục dữ liệu thông qua cổng kết nối tài khoản Google cá nhân của chính bạn.
  * Bản sao lưu được lưu trữ trong phân vùng **AppData ẩn** độc lập trên Drive của bạn, tránh tuyệt đối việc bị xóa nhầm hoặc truy cập trái phép.
* **Tính hiệu suất xăng thông minh**: 
  * Tính toán hiệu suất tiêu hao trung bình thực tế (**km/L**) của xe dựa trên mốc ODO và số lít xăng giữa các lần đổ đầy bình.
  * Tự động tính cộng dồn lượng xăng của các lần đổ lẻ (không đầy bình) vào kỳ đầy bình tiếp theo để đảm bảo tính toán luôn chính xác nhất.
* **Chụp ảnh và nén biên lai**:
  * Cho phép chụp ảnh trực tiếp từ camera hoặc tải ảnh biên lai bảo dưỡng/chi phí lên để lưu trữ cùng lịch sử.
  * Tích hợp thuật toán nén ảnh tự động bằng HTML5 Canvas (giảm dung lượng ảnh từ 5MB xuống còn ~50KB) giúp tiết kiệm bộ nhớ máy và chống lag app.
* **Độ rộng Responsive**: Giao diện thiết kế theo chuẩn di động hiện đại nhưng co giãn mượt mà khi đổi kích thước trên cả tablet và máy tính lớn.

---

## 🛠️ Công nghệ sử dụng

* **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons).
* **Cơ sở dữ liệu**: Dexie.js (IndexedDB wrapper).
* **Đồng bộ**: REST Google Drive API (OAuth 2.0).
* **Đóng gói**: Vite PWA Plugin, Terser Minifier (tự động lọc sạch debug logs trên production).

---

## 📂 Tài liệu hướng dẫn chi tiết (Folder `docs/`)

Để tìm hiểu sâu hơn về mặt kỹ thuật, bạn có thể tham khảo các tài liệu chuyên đề sau:
1. 📐 **[Kiến trúc hệ thống (docs/architecture.md)](./docs/architecture.md)**: Phân tích mô hình Offline-First, cấu trúc DB cục bộ, và công thức tính km/L cộng dồn.
2. 🚀 **[Hướng dẫn triển khai (docs/deployment.md)](./docs/deployment.md)**: Cách chạy dự án ở local, build tối ưu bằng Terser và cấu hình deploy tự động GitHub Actions.
3. 🛡️ **[Thiết lập Bảo mật & Nén ảnh (docs/security.md)](./docs/security.md)**: Tìm hiểu về phân vùng dữ liệu ẩn Google Drive và cách nén Canvas để bảo vệ bộ nhớ IndexedDB.
4. 📝 **[Nhật ký cập nhật (CHANGELOG.md)](./CHANGELOG.md)**: Lịch sử cập nhật và phát hành của các phiên bản.

---

## 💻 Hướng dẫn chạy cục bộ (Local)

1. Tải mã nguồn về máy:
   ```bash
   git clone https://github.com/DPNK186/fuel-tracker-DPNE03.git
   cd fuel-tracker-DPNE03
   ```
2. Cài đặt các dependencies:
   ```bash
   npm install
   ```
3. Tạo file cấu hình `.env` ở thư mục gốc và dán mã Google Client ID của bạn vào:
   ```env
   VITE_GOOGLE_CLIENT_ID=mã_client_id_của_bạn.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=
   ```
4. Khởi chạy dev server:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt truy cập: `http://localhost:5173/fuel-tracker-DPNE03/`
