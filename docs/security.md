# Thiết lập Bảo mật và Tối ưu dữ liệu (Security & Optimization)

Ứng dụng **Xăng Xe** được thiết kế để đặt tính riêng tư, bảo mật và hiệu năng tải của thiết bị di động lên hàng đầu.

---

## 1. Bảo mật dữ liệu sao lưu (Google Drive AppData)
Để tránh việc rò rỉ dữ liệu hoặc người dùng vô tình làm mất file sao lưu, ứng dụng áp dụng cơ chế thư mục ẩn **AppDataFolder**:
* **Quyền truy cập hạn chế (Scope)**: Ứng dụng chỉ xin cấp quyền `https://www.googleapis.com/auth/drive.appdata`. Quyền này chỉ cho phép app đọc/ghi trong một phân vùng ẩn dành riêng cho ứng dụng trên Drive của chính người dùng đó.
* **Không thể truy cập chéo**: Nhà phát triển (Dev) hoặc bất kỳ ứng dụng nào khác trên Internet đều không thể truy cập vào phân vùng AppData này của người dùng.
* **Không hiển thị ngoài giao diện**: File `fuel_tracker_backup.json` hoàn toàn không hiển thị trên giao diện danh sách file Drive thông thường của người dùng, đảm bảo file không bao giờ bị xóa nhầm.

---

## 2. Bảo mật luồng đăng nhập (OAuth 2.0 Implicit Flow)
* Ứng dụng sử dụng luồng xác thực **Implicit Flow** trực tiếp từ trình duyệt của người dùng đến máy chủ Google Accounts.
* **Không lưu trữ mật khẩu**: Ứng dụng không bao giờ yêu cầu hay lưu trữ mật khẩu Google của người dùng. Việc đăng nhập được xử lý trực tiếp bởi Google.
* **Hạn sử dụng Token**: Access Token được lưu trữ tạm thời trong `localStorage` và có thời hạn tự hủy (thường là 1 giờ). Sau khi hết hạn, ứng dụng sẽ tự động đăng xuất và yêu cầu xác thực lại để đảm bảo an toàn.

---

## 3. Tối ưu hóa dung lượng cơ sở dữ liệu IndexedDB
Do người dùng di động chụp ảnh hóa đơn/biên lai chi phí bằng camera độ phân giải cao (ảnh gốc thường nặng từ 3MB - 12MB), nếu lưu trữ trực tiếp ảnh base64 này vào IndexedDB sẽ gây đầy bộ nhớ đệm và làm lag ứng dụng:
* **Cơ chế nén ảnh bằng HTML5 Canvas**:
  - Khi người dùng chụp hoặc chọn ảnh hóa đơn trong [ExpenseForm.jsx](file:///d:/AI-Fuel-Tracker/src/components/ExpenseForm.jsx), ứng dụng sẽ tự động tải ảnh lên một đối tượng Canvas ẩn.
  - Tự động thay đổi kích thước (resize) ảnh về chiều rộng tối đa là **600px** (giữ nguyên tỷ lệ khung hình).
  - Nén chất lượng ảnh JPEG xuống mức **70% (quality = 0.7)**.
* **Kết quả**: Ảnh nén xong chỉ chiếm từ **30KB - 70KB** (giảm hơn 95% dung lượng) nhưng vẫn giữ được độ nét rõ ràng của các con số trên hóa đơn, giúp IndexedDB hoạt động mượt mà và tiết kiệm tối đa dung lượng bộ nhớ điện thoại của người dùng.
