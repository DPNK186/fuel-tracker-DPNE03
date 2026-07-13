# Hướng dẫn triển khai và Cấu hình (Deployment)

Tài liệu này hướng dẫn bạn cách chạy dự án ở môi trường cục bộ (local) và các phương pháp biên dịch đóng gói để deploy lên **GitHub Pages**.

---

## 1. Cấu hình môi trường (`.env`)
Dự án sử dụng file `.env` ở thư mục gốc để cấu hình Google OAuth Client ID dùng cho tính năng đồng bộ.
> [!WARNING]
> Tệp `.env` chứa mã cấu hình nhạy cảm và đã được đưa vào [.gitignore](file:///d:/AI-Fuel-Tracker/.gitignore). **Tuyệt đối không bao giờ** được commit hoặc push file `.env` thực tế lên các kho chứa mã nguồn công khai (Public GitHub repositories).

Mẫu cấu hình (`.env.example`):
```env
VITE_GOOGLE_CLIENT_ID=425147321997-ojjgks40prnbj1npse9c7o4jqjms4gp9.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=
```

---

## 2. Chạy thử nghiệm ở Local
1. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi chạy server phát triển:
   ```bash
   npm run dev
   ```
3. Truy cập địa chỉ local hiển thị trên terminal:
   `http://localhost:5173/fuel-tracker-DPNE03/`

---

## 3. Biên dịch và Đóng gói (Production Build)
Để tối ưu hóa mã nguồn trước khi đưa lên production:
* Dự án tích hợp thư viện **Terser** làm trình rút gọn mã nguồn chính thức (minify) cấu hình tại [vite.config.js](file:///d:/AI-Fuel-Tracker/vite.config.js).
* Khi chạy build, Terser sẽ tự động quét và loại bỏ sạch toàn bộ các câu lệnh `console.log` và `debugger` để bảo mật thuật toán và tăng tốc độ ứng dụng.

Chạy lệnh biên dịch:
```bash
npm run build
```
Sản phẩm đầu ra sẽ nằm trong thư mục **`dist/`** sẵn sàng để deploy.

---

## 4. Triển khai lên GitHub Pages (Production Deploy)
Dự án cấu hình base path là `/fuel-tracker-DPNE03/` để chạy tương thích hoàn hảo trên GitHub Pages. Bạn có thể triển khai theo một trong hai cách dưới đây:

### Cách 1: Triển khai thủ công cực nhanh bằng 1 dòng lệnh (Khuyên dùng)
Bạn mở Terminal dưới máy local và chạy lệnh:
```bash
npm run deploy
```
* **Cơ chế**: Lệnh này tự động kích hoạt `predeploy` (chạy `npm run build` đóng gói) và dùng thư viện `gh-pages` để đẩy toàn bộ các file tĩnh trong thư mục `dist/` trực tiếp lên nhánh **`gh-pages`** trên GitHub của bạn.
* Khi chạy xong và báo **`Published`**, trang web đã sẵn sàng hoạt động trực tuyến.

### Cách 2: Tự động hóa qua GitHub Actions
Mỗi khi bạn thực hiện commit và push code mới lên nhánh **`main`**, file workflow cấu hình sẵn tại [.github/workflows/deploy.yml](file:///d:/AI-Fuel-Tracker/.github/workflows/deploy.yml) sẽ tự động kích hoạt:
1. Tạo môi trường chạy ảo Node.js.
2. Biên dịch dự án bằng lệnh `npm run build`.
3. Đẩy bản build tĩnh lên nhánh `gh-pages` một cách hoàn toàn tự động.
*(Bạn có thể theo dõi tiến độ chạy này tại tab **Actions** trên Repository GitHub của bạn).*

---

## 5. Cấu hình Kích hoạt trang trên GitHub Settings
Sau khi deploy lần đầu (bằng cách 1 hoặc cách 2), bạn cần thiết lập để GitHub Pages biết nguồn đọc file:
1. Vào trang GitHub của Repository -> chọn tab **Settings** (Cài đặt) trên cùng.
2. Nhấp chọn mục **Pages** ở thanh menu bên trái.
3. Tại phần **Build and deployment** -> **Branch**:
   - Chọn nhánh **`gh-pages`** (thay vì `None` hay `main`).
   - Thư mục giữ nguyên là **`/ (root)`**.
   - Bấm nút **Save** (Lưu).
4. Trang web chính thức của bạn sẽ trực tuyến tại địa chỉ:
   `https://<tên_tài_khoản_github>.github.io/fuel-tracker-DPNE03/`
