# Hướng dẫn triển khai và Cấu hình (Deployment)

Tài liệu này hướng dẫn bạn cách chạy dự án ở môi trường cục bộ (local) và cách biên dịch đóng gói để deploy lên **GitHub Pages**.

---

## 1. Cấu hình môi trường (`.env`)
Dự án sử dụng các biến môi trường sau để cấu hình xác thực Google OAuth. Hãy tạo file `.env` ở thư mục gốc:

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
* Dự án tích hợp thư viện **Terser** làm trình rút gọn mã nguồn chính thức (minify).
* Khi chạy build, Terser sẽ tự động quét và loại bỏ sạch toàn bộ các câu lệnh `console.log` và `debugger` để tăng tốc độ chạy và bảo mật logic của ứng dụng.

Chạy lệnh biên dịch:
```bash
npm run build
```
Sản phẩm đầu ra sẽ nằm trong thư mục **`dist/`** sẵn sàng để deploy lên hosting.

---

## 4. Triển khai lên GitHub Pages
Dự án được cấu hình sẵn base path là `/fuel-tracker-DPNE03/` trong [vite.config.js](file:///d:/AI-Fuel-Tracker/vite.config.js) để khớp với cấu trúc URL của GitHub Pages.

### Các bước deploy:
1. Bạn có thể sử dụng thư viện `gh-pages` để đẩy nhanh thư mục `dist/` lên nhánh `gh-pages` của GitHub.
2. Hoặc cấu hình **GitHub Actions** tự động biên dịch và deploy mỗi khi push code mới lên nhánh `main`.
3. Đảm bảo bạn đã thêm URL GitHub Pages vào danh sách **Authorized redirect URIs** trên trang quản lý Google Cloud Console của bạn:
   `https://<username>.github.io/fuel-tracker-DPNE03/`
