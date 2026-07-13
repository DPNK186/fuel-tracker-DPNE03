# Thiết lập Bảo mật và Tối ưu dữ liệu (Security & Optimization)

Ứng dụng **Xăng Xe** được thiết kế để đặt tính riêng tư, bảo mật thông tin và hiệu năng của thiết bị lên hàng đầu.

---

## 1. Bảo mật file cấu hình nhạy cảm (`.env`) khi Public Mã nguồn
Dự án sử dụng Google Client ID phục vụ cho việc tích hợp cổng Google Drive. Khi bạn đổi Repository sang chế độ **Công khai (Public)**:
* **Hành động bảo vệ**: File `.env` thực tế đã được loại bỏ hoàn toàn khỏi Git Tracking bằng lệnh `git rm --cached .env` và được khai báo bỏ qua trong [.gitignore](file:///d:/AI-Fuel-Tracker/.gitignore).
* **Cơ chế fallback mặc định an toàn**: Để đảm bảo ứng dụng deploy tự động bằng GitHub Actions (nơi không nạp file `.env`) vẫn hoạt động trơn tru, mã nguồn được thiết lập giá trị Client ID mặc định làm fallback. 
* **Tính bảo mật của Client ID**: Google Client ID thực tế chỉ đóng vai trò định danh ứng dụng ở client-side (không phải thông tin mật như Client Secret hay API Key). Cơ chế đăng nhập Google OAuth 2.0 kiểm soát và bảo vệ chặt chẽ thông qua danh sách **Authorized JavaScript Origins** và **Authorized Redirect URIs** cấu hình trực tiếp trên Google Cloud Console (xem chi tiết mục 2 dưới đây). Vì vậy, việc cấu hình mặc định này hoàn toàn an toàn và tuân thủ các thực hành bảo mật chuẩn của Google.

---

## 2. Hạn chế tên miền trên Google Cloud Console (Authorized Origins)
Bản chất của Google OAuth Client ID là phải hiển thị ở client-side trên trình duyệt để kích hoạt popup đăng nhập. Vì vậy, để bảo vệ Client ID của bạn không bị kẻ xấu đánh cắp và mang đi sử dụng trái phép ở các website/ứng dụng khác, bạn **bắt buộc** phải thiết lập các lớp bảo vệ nguồn gốc (Origins) trên trang quản lý Google Cloud:

1. Truy cập vào **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Nhấp chọn chỉnh sửa **OAuth 2.0 Client ID** đang được ứng dụng sử dụng.
3. Tại mục **Authorized JavaScript origins** (Nguồn gốc JavaScript được phép):
   - Chỉ điền các tên miền tin cậy được quyền gọi cổng đăng nhập OAuth:
     - `https://dpnk186.github.io` (Tên miền chính thức chạy ứng dụng)
     - `http://localhost:5173` (Tên miền test local)
     - `http://localhost:4173` (Tên miền test bản build local)
   - *Xóa bỏ toàn bộ các tên miền lạ khác.*
4. Tại mục **Authorized redirect URIs** (URI chuyển hướng được phép):
   - Chỉ điền các đường dẫn chuyển hướng được cấp phép:
     - `https://dpnk186.github.io/fuel-tracker-DPNE03/`
     - `http://localhost:5173/`
5. Bấm **Save (Lưu)**. Khi hoàn tất, kể cả khi kẻ xấu lấy được Client ID của bạn, Google OAuth sẽ lập tức **chặn đứng** toàn bộ yêu cầu đăng nhập đến từ các trang web lạ khác không nằm trong danh sách trắng này.

---

## 3. Bảo mật dữ liệu sao lưu (Google Drive AppData)
Để tránh việc rò rỉ dữ liệu hoặc người dùng vô tình làm mất file sao lưu, ứng dụng áp dụng cơ chế thư mục ẩn **AppDataFolder**:
* **Quyền truy cập hạn chế (Scope)**: Ứng dụng chỉ xin cấp quyền `https://www.googleapis.com/auth/drive.appdata`. Quyền này chỉ cho phép app đọc/ghi trong một phân vùng ẩn dành riêng cho ứng dụng trên Drive của chính người dùng đó.
* **Không thể truy cập chéo**: Nhà phát triển (Dev) hoặc bất kỳ ứng dụng nào khác trên Internet đều không thể truy cập vào phân vùng AppData này của người dùng.
* **Không hiển thị ngoài giao diện**: File `fuel_tracker_backup.json` hoàn toàn không hiển thị trên giao diện danh sách file Drive thông thường của người dùng, đảm bảo file không bao giờ bị xóa nhầm.

---

## 4. Bảo mật luồng đăng nhập (OAuth 2.0 Implicit Flow)
* Ứng dụng sử dụng luồng xác thực **Implicit Flow** trực tiếp từ trình duyệt của người dùng đến máy chủ Google Accounts.
* **Không lưu trữ mật khẩu**: Ứng dụng không bao giờ yêu cầu hay lưu trữ mật khẩu Google của người dùng. Việc đăng nhập được xử lý trực tiếp bởi Google.
* **Hạn sử dụng Token**: Access Token được lưu trữ tạm thời trong `localStorage` và có thời hạn tự hủy (thường là 1 giờ). Sau khi hết hạn, ứng dụng sẽ tự động đăng xuất và yêu cầu xác thực lại để đảm bảo an toàn.

---

## 5. Tối ưu hóa dung lượng cơ sở dữ liệu IndexedDB
Do người dùng di động chụp ảnh hóa đơn/biên lai chi phí bằng camera độ phân giải cao (ảnh gốc thường nặng từ 3MB - 12MB), nếu lưu trữ trực tiếp ảnh base64 này vào IndexedDB sẽ gây đầy bộ nhớ đệm và làm lag ứng dụng:
* **Cơ chế nén ảnh bằng HTML5 Canvas**:
  - Khi người dùng chụp hoặc chọn ảnh hóa đơn trong [ExpenseForm.jsx](file:///d:/AI-Fuel-Tracker/src/components/ExpenseForm.jsx), ứng dụng sẽ tự động tải ảnh lên một đối tượng Canvas ẩn.
  - Tự động thay đổi kích thước (resize) ảnh về chiều rộng tối đa là **600px** (giữ nguyên tỷ lệ khung hình).
  - Nén chất lượng ảnh JPEG xuống mức **70% (quality = 0.7)**.
* **Kết quả**: Ảnh nén xong chỉ chiếm từ **30KB - 70KB** (giảm hơn 95% dung lượng) nhưng vẫn giữ được độ nét rõ ràng của các con số trên hóa đơn, giúp IndexedDB hoạt động mượt mà và tiết kiệm tối đa dung lượng bộ nhớ điện thoại của người dùng.
