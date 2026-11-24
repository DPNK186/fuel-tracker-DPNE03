# Hướng dẫn Publish Google App & Deploy Cloudflare Worker (Giữ đăng nhập Google Drive vĩnh viễn)

Tài liệu này hướng dẫn 2 bước để loại bỏ hoàn toàn:
1. Màn hình cảnh báo **"Google hasn't verified this app"** (do app đang ở chế độ Testing).
2. Tình trạng **phải đăng nhập lại sau mỗi 1 giờ** (do SPA thuần frontend không giữ được `refresh_token`).

---

## Phần 1: Publish App trên Google Cloud Console (Bỏ cảnh báo chưa xác minh)

Vì ứng dụng chỉ sử dụng duy nhất scope `https://www.googleapis.com/auth/drive.appdata` (thuộc nhóm **Non-sensitive scope** — chỉ truy cập thư mục ẩn của riêng app), bạn có thể chuyển sang trạng thái **In Production** mà không cần tốn chi phí kiểm định bảo mật (CASA).

### Các bước thực hiện:
1. Deploy bản cập nhật mới lên GitHub Pages (`npm run deploy`) để trang Chính sách quyền riêng tư có sẵn tại:
   `https://<ten-github-cua-ban>.github.io/fuel-tracker-DPNE03/privacy.html`
2. Truy cập [Google Cloud Console](https://console.cloud.google.com/) → chọn Project đang chứa `CLIENT_ID` của app.
3. Vào menu **APIs & Services → OAuth consent screen** (hoặc **Google Auth Platform → Branding / Audience**).
4. Trong mục **Branding / App information**, điền đầy đủ:
   - **App name:** `Xăng Xe - Fuel Tracker`
   - **User support email:** chọn email của bạn
   - **Application home page:** `https://<ten-github-cua-ban>.github.io/fuel-tracker-DPNE03/`
   - **Application privacy policy link:** `https://<ten-github-cua-ban>.github.io/fuel-tracker-DPNE03/privacy.html`
   - **Application terms of service link:** `https://<ten-github-cua-ban>.github.io/fuel-tracker-DPNE03/terms.html` *(tùy chọn, có thể để trống hoặc điền link này)*
   - **Authorized domains:** thêm `github.io`
   - **Developer contact information:** điền email của bạn → **Save**.
5. Vào mục **Audience** (hoặc **Publishing status**) → bấm **PUBLISH APP** → xác nhận chuyển từ **Testing** sang **In Production**.
6. Kiểm tra mục **Data Access / Scopes**: đảm bảo chỉ có scope `.../auth/drive.appdata` (không chọn các scope nhạy cảm như `drive` hay `drive.readonly`).

> **Kết quả:** Sau khi chuyển sang **In Production**, người dùng đăng nhập sẽ không còn bị chặn bởi màn hình cảnh báo chưa xác minh, và `refresh_token` sẽ không bị Google thu hồi sau 7 ngày như chế độ Testing.

---

## Phần 2: Deploy Cloudflare Worker miễn phí (Tự động gia hạn Token vĩnh viễn)

Google OAuth yêu cầu `Client Secret` để đổi lấy `refresh_token`. Vì không được phép đưa `Client Secret` vào code frontend, ta dùng **Cloudflare Worker miễn phí** (giới hạn 100.000 request/ngày, quá dư cho nhu cầu cá nhân) làm cầu nối an toàn.

### Bước 1: Lấy `Client ID` và `Client Secret` trên Google Cloud Console
1. Vào **Google Cloud Console → APIs & Services → Credentials**.
2. Bấm vào OAuth 2.0 Client ID (loại **Web application**) mà bạn đang dùng.
3. Trong mục **Authorized JavaScript origins**, đảm bảo có:
   - `https://<ten-github-cua-ban>.github.io`
   - `http://localhost:5173` (nếu muốn test local)
4. Trong mục **Authorized redirect URIs**, thêm:
   - `https://<ten-github-cua-ban>.github.io`
   - `http://localhost:5173`
   *(Lưu ý: Google GIS `initCodeClient` với `ux_mode: 'popup'` dùng `redirect_uri: 'postmessage'`, Google tự chấp nhận khi JavaScript origins hợp lệ).*
5. Copy lại **Client ID** và **Client Secret**.

### Bước 2: Deploy Worker lên Cloudflare (Cách nhanh nhất qua Web Dashboard, không cần cài CLI)
1. Đăng ký/Đăng nhập tài khoản miễn phí tại [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages → Create → Create Worker**.
3. Đặt tên Worker (ví dụ: `fuel-tracker-oauth-proxy`) → bấm **Deploy**.
4. Bấm **Edit code**, xóa toàn bộ code mẫu và dán toàn bộ nội dung file `cloudflare-worker/oauth-worker.js` trong dự án này vào → bấm **Deploy** (góc trên bên phải).
5. Quay lại trang quản lý Worker → vào tab **Settings → Variables and Secrets**:
   - Thêm **Secret** (bật Encrypt):
     - `GOOGLE_CLIENT_ID` = *(Client ID bạn vừa copy)*
     - `GOOGLE_CLIENT_SECRET` = *(Client Secret bạn vừa copy)*
   - Thêm **Text variable**:
     - `ALLOWED_ORIGINS` = `https://<ten-github-cua-ban>.github.io,http://localhost:5173`
   - Bấm **Deploy / Save**.
6. Kiểm tra Worker hoạt động bằng cách mở trình duyệt vào:
   `https://fuel-tracker-oauth-proxy.<subdomain-cua-ban>.workers.dev/health`
   Nếu thấy `{"ok":true,"configured":true}` là thành công!

*(Hoặc nếu bạn thích dùng CLI: vào thư mục `cloudflare-worker/`, sửa `ALLOWED_ORIGINS` trong `wrangler.toml`, chạy `npx wrangler login`, `npx wrangler secret put GOOGLE_CLIENT_ID`, `npx wrangler secret put GOOGLE_CLIENT_SECRET`, rồi `npx wrangler deploy`).*

### Bước 3: Kết nối Worker với ứng dụng Fuel Tracker
1. Tại thư mục gốc dự án, tạo (hoặc sửa) file `.env` (file này không commit lên Git nếu chứa thông tin riêng, hoặc có thể lưu URL Worker công khai):
   ```env
   VITE_GOOGLE_CLIENT_ID=425147321997-ojjgks40prnbj1npse9c7o4jqjms4gp9.apps.googleusercontent.com
   VITE_OAUTH_WORKER_URL=https://fuel-tracker-oauth-proxy.<subdomain-cua-ban>.workers.dev
   ```
2. Build và deploy lại ứng dụng:
   ```bash
   npm run deploy
   ```
3. Mở ứng dụng → vào tab **Sao lưu** → nếu trước đó đã kết nối theo kiểu cũ, bấm **Đăng xuất / Hủy kết nối** rồi bấm **Đăng nhập & Sao lưu ngay** lại 1 lần duy nhất.
4. Từ giờ trở đi, trạng thái sẽ hiển thị **Gia hạn tự động (Worker)** — mỗi khi token hết hạn 1 giờ, app tự gọi Worker gia hạn ngầm trong tích tắc mà **không bao giờ hiện popup đăng nhập lại**.

---

## Phần 3: Nhật ký Cấu hình & Quản lý Secret đang dùng (để Disable / Rotate khi cần)

| Hạng mục | Thông tin nhận diện |
| :--- | :--- |
| **Cloudflare Worker URL** | `https://fuel-tracker-dpne03.dpn-e103a.workers.dev` |
| **Google OAuth Client Secret** | `****PS--` *(chỉ lưu 4 ký tự cuối để nhận diện, không lưu giá trị thật)* |
| **Ngày tạo (Creation date)** | `November 24, 2026, 8:02:59 PM GMT+7` |
| **Trạng thái (Status)** | `Enabled` |

### Cách Disable / Thu hồi khi không còn sử dụng:
1. Vào **Google Cloud Console → APIs & Services → Credentials** → chọn OAuth 2.0 Client ID của app.
2. Trong bảng **Client secrets**, tìm dòng có hậu tố `****PS--` (tạo lúc `Nov 24, 2026, 8:02:59 PM GMT+7`) → bấm **Disable** (hoặc biểu tượng thùng rác **Delete**).
3. Nếu muốn ngưng hẳn Worker, vào **Cloudflare Dashboard → Workers & Pages → `fuel-tracker-dpne03` → Settings** để xóa Secret `GOOGLE_CLIENT_SECRET` hoặc xóa Worker.

