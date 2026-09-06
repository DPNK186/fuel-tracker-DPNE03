# Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi nhận tại đây.

## 🚀 [1.3.1] - 2026-09-06

### Added (Tính năng mới & Trải nghiệm)
- **Cơ sở dữ liệu xe phổ thông & Gợi ý dung tích bình xăng:** Tích hợp sẵn database offline gồm hơn 35 dòng xe máy (Honda, Yamaha, Piaggio/Vespa, Suzuki) và ô tô phổ thông tại Việt Nam kèm dung tích bình xăng chuẩn hãng.
- **Phân tách biến thể xe Winner / Winner X:** Hỗ trợ nhận diện chính xác cả Honda Winner 150 và Honda Winner X (đều 4.5L) qua tên gọi và từ khóa tìm kiếm (`aliases`).
- **Gợi ý tự động & Quick Chips 1 chạm:** Hàng nút bấm chọn nhanh các mẫu xe quốc dân (Vision, Air Blade, Lead, SH, Winner X, Exciter, Wave Alpha, Vios...) và dropdown tự động gợi ý khi gõ tên xe (hỗ trợ tiếng Việt có dấu, không dấu, phím `Esc`, tự động đóng khi chuyển ô nhập và nút xóa nhanh nội dung).
- **Tự động gợi ý đơn giá từ lần đổ gần nhất:** Tự động điền đơn giá từ lần đổ xăng trước của xe & loại nhiên liệu khi mở form thêm mới, giúp người dùng chỉ cần nhập Tổng tiền là tự ra Số lít.
- **Tính toán 3 chiều linh hoạt khi nhập nhiên liệu:** Hỗ trợ nhập 2 trường bất kỳ trong bộ 3 (Số lít, Đơn giá, Tổng tiền) để tự động tính trường còn lại theo cơ chế ưu tiên: Tổng tiền > Số lít > Đơn giá; 2 trường mới nhập gần nhất luôn được bảo lưu.
- **Nhập liệu số thập phân an toàn:** Hỗ trợ nhập cả dấu phẩy `,` và dấu chấm `.` (ví dụ `4,5` hoặc `4.5`), giữ nguyên ký tự khi gõ dở không gián đoạn con trỏ chuột.
- **Chuẩn hóa làm tròn:** Làm tròn số nguyên cho tiền tệ (VND) và 1 chữ số thập phân cho Số lít (`.toFixed(1)`).
- **Gợi ý trực quan trên Form (UI Hint):** Bổ sung chỉ dẫn trực quan hướng dẫn tính năng tính toán 3 chiều ngay dưới form nhập liệu.

### Fixed (Sửa lỗi)
- **Khắc phục triệt để lỗi không tự động chuyển sang xe mới tạo:** Giải quyết race condition trong `useEffect` quản lý xe hiện hành của `App.jsx`, đảm bảo ứng dụng lập tức chuyển sang và lưu trữ xe mới tạo làm phương tiện active.
- **Đồng bộ hiển thị phiên bản:** Cập nhật nhãn phiên bản ứng dụng trong tab Đồng bộ (`SyncBackup.jsx`) và `package.json` lên phiên bản v1.3.1.

## 🚀 [1.3.0] - 2026-07-27

### Fixed (Sửa lỗi quan trọng)
- **Khắc phục triệt để lỗi tự bật popup ngầm & kẹt ứng dụng ở Tab Đồng bộ:** Loại bỏ lệnh tự động gọi `refreshTokenSilently()` (`prompt: 'none'`) khi vừa vào Tab Đồng bộ lúc token 1 giờ đã hết hạn. Chuyển sang thẻ "Phiên đăng nhập đã hết hạn" tức thì (0ms) mà không bật bất kỳ popup ngầm nào, giúp ứng dụng hoạt động 100% mượt mà không bị treo hay giật lag.

## 🚀 [1.2.9] - 2026-07-26

### Improved (Cải tiến trải nghiệm đồng bộ)
- **Tự động điều chỉnh giao diện Tab Đồng bộ theo phiên Google:** Giữ thanh Header ở trên cùng luôn sạch sẽ, gọn gàng. Khi hết phiên đăng nhập (Expired Session), thẻ chính trong Tab Đồng bộ tự động đổi sang "Phiên đăng nhập đã hết hạn" kèm nút "Đăng nhập & Hợp nhất Google Drive" giúp đăng nhập lại và đồng bộ chỉ với 1 cú nhấp.

## 🚀 [1.2.8] - 2026-07-26

### Improved (Cải tiến giao diện & trải nghiệm)
- **Giao diện Header Sync Badge 2 dòng:** Thiết kế bố cục 2 dòng gọn gàng (Dòng 1: Trạng thái Đã Sync/Chưa Sync/Syncing; Dòng 2: Mốc thời gian tương đối hoặc cảnh báo), ngăn chặn 100% hiện tượng ngắt dòng ngẫu nhiên trên màn hình di động nhỏ.
- **Hệ thống định dạng mốc thời gian đa nấc:** Hỗ trợ tính thời gian tương đối linh hoạt dưới 60s (`vừa xong`), dưới 60m (`Xp trước`), dưới 24h (`Xh trước`), từ 1 đến 7 ngày (`X ngày trước`) và trên 7 ngày (`DD/MM`).

## 🚀 [1.2.7] - 2026-07-26

### Added (Thêm mới)
- **Sao Lưu Thủ Công Theo Yêu Cầu (On-Demand Manual Sync):** Loại bỏ hoàn toàn cơ chế tự động auto-backup ngầm để tránh gây phiền hà hoặc đòi hỏi popup đăng nhập lại liên tục; mặc định lưu trữ 100% Offline-First tại Local IndexedDB.
- **Hợp Nhất Dữ Liệu Thông Minh (Smart Data Merge):** Khi bấm nút "Sao lưu & Hợp nhất lên Google Drive", ứng dụng tự động đối chiếu, khử trùng lặp và gộp toàn bộ lịch sử đổ xăng, chi phí và thông tin xe từ cả Local và Cloud.
- **Chống Trùng Lặp Xe Theo Biển Số:** Chuẩn hóa biển số xe (`normalizePlate`), cảnh báo khi thêm xe trùng biển số và tự động gộp các xe trùng biển số trên Local và Cloud thành 1 phương tiện duy nhất.
- **Hợp Nhất Xe Khi Chỉnh Sửa & Xác Minh Odometer:** Khi sửa thông tin một xe có biển số trùng với xe đã có, ứng dụng kích hoạt luồng hợp nhất dữ liệu kèm kiểm tra tính hợp lệ của Odometer tăng dần theo thời gian.
- **Bộ Đếm Last Cloud Sync & Chỉ Báo Chưa Sync Trên Header:** Hiển thị mốc thời gian đồng bộ gần nhất ("Đã Sync (15p trước)") và tự động bật nhãn vàng nhấp nháy ("Chưa Sync (Có data mới)") khi có thay đổi chưa sao lưu. Chạm trực tiếp vào nhãn để mở nhanh tab Đồng bộ.

## 🚀 [1.2.6] - 2026-07-25

### Fixed (Sửa lỗi)
- Chuyển đổi tham số gia hạn token ngầm từ `prompt: ''` thành `prompt: 'none'` chuẩn theo quy định của Google Identity Services (GIS) SDK.
- Ngăn chặn 100% tình trạng Google SDK tự ý nảy cửa sổ Pop-up đòi đăng nhập sau 1 giờ hoạt động ngầm (nguyên nhân gây kích hoạt bộ chặn Pop-ups Blocked của trình duyệt Chrome).
- Tự động nhận và cập nhật Access Token ngầm trực tiếp vào `localStorage` mà không làm gián đoạn hay ảnh hưởng tới thao tác của người dùng trên màn hình.

## 🚀 [1.2.5] - 2026-07-25

### Fixed (Sửa lỗi & Tối ưu)
- Khắc phục triệt để lỗi thời gian duy trì phiên đăng nhập Google Sign-In bị quá ngắn (< 1 ngày).
- Tích hợp hàm bất đồng bộ `waitForGoogleSDK()` hỗ trợ kiên nhẫn chờ thư viện Google Identity Services (`window.google.accounts.oauth2`) sẵn sàng trước khi kiểm tra hoặc làm mới token, giải quyết hiện tượng xung đột khởi chạy (Race Condition) báo nhầm "Hết hạn phiên".
- Bổ sung **Cơ chế gia hạn ngầm chủ động (Proactive Background Token Refresh)** tự động đặt lịch làm mới token trước khi hết hạn 15 phút (mỗi 45 phút) trong quá trình người dùng sử dụng ứng dụng.
- Tự động thực hiện Silent Refresh ngầm khi mở lại ứng dụng sau 1 ngày (hoặc nhiều ngày), giúp người dùng luôn duy trì phiên làm việc liền mạch mà không phải bấm kết nối lại.

## 🚀 [1.2.4] - 2026-07-19

### Added (Thêm mới)
- Tự động kiểm tra và đồng bộ dữ liệu mới từ Google Drive (Auto-Pull) ngay khi mở ứng dụng hoặc khi thiết bị kết nối mạng lại.
- Thiết lập cơ chế **Chống spam yêu cầu (Anti-Spam Throttling)** bằng cách kiểm tra trạng thái tiến trình hiện hành (`isSyncingRef`) và giới hạn thời gian chạy tối đa 1 lần mỗi 10 giây (`lastSyncAttemptRef`), ngăn chặn tình trạng spam request lên API Google khi mạng chập chờn hoặc tải lại trang liên tục.

## 🚀 [1.2.3] - 2026-07-19

### Fixed (Sửa lỗi)
- Khắc phục triệt để lỗi mất trạng thái đăng nhập Google (đặc biệt là trên Android PWA sau một thời gian không sử dụng).
- Không tự động đăng xuất (logout) khi silent refresh thất bại vì các chính sách cookies chặn luồng ngầm trên thiết bị di động/localhost.
- Bổ sung giao diện "Phiên kết nối hết hạn" yêu cầu người dùng kết nối lại trực quan thay vì tự động xóa sạch session và đưa về trạng thái trắng.
- Tự động gợi ý cửa sổ đăng nhập lại khi người dùng nhấn "Sao lưu" hoặc "Khôi phục" trong khi session đã hết hạn, và tiếp tục chạy tác vụ ngay sau khi đăng nhập thành công.
- Tích hợp trạng thái hiển thị "Cần kết nối lại" trên thanh trạng thái đồng bộ Header.

## 🚀 [1.2.2] - 2026-07-17

### Fixed (Sửa lỗi)
- Sửa lỗi mất session đăng nhập Google khi chuyển đổi qua lại giữa các tab (hoặc khi component mount). Chỉ kích hoạt làm mới token ngầm `refreshTokenSilently` khi token cũ thực sự hết hạn hoặc không tồn tại.

## 🚀 [1.2.1] - 2026-07-17

### Added (Thêm mới)
- Tích hợp thư viện **Google Identity Services (GIS) SDK** để nâng cấp luồng đăng nhập Google.
- Hỗ trợ popup đăng nhập Google an toàn trực tiếp trên ứng dụng, không còn chuyển hướng toàn bộ trang web.
- Thêm tính năng **Tự động làm mới token ngầm (Silent Token Refresh)** trước mỗi lần đồng bộ hoặc khi ứng dụng khởi chạy nếu người dùng đã từng kết nối thành công trước đó (thông qua cờ `google_logged_in`).

### Changed (Thay đổi)
- Cập nhật hàm `isConnected()`, `getAccessToken()`, `backup()`, `restore()`, và `autoBackup()` để phối hợp đồng bộ với cơ chế tự động gia hạn token.

## 🚀 [1.2.0] - 2026-07-17

### Add (Thêm mới)
- Tích hợp **Tính năng Tự động đồng bộ Google Drive ngầm (Background Auto Sync)**: Tự động chạy sao lưu dữ liệu lên đám mây ở chế độ ngầm sau mỗi thao tác thêm, sửa hoặc xóa dữ liệu (xe máy/ô tô, đổ xăng, chi phí khác). Tự động trích xuất token đăng nhập tức thì ở cấp cao nhất (`App.jsx`) và tự động kiểm tra/đồng bộ ngay sau khi người dùng đăng nhập thành công.
- Thêm cơ chế **Tự động thử lại (Retry) thông minh**: Khi mất kết nối hoặc lỗi API, hệ thống sẽ tự động thử lại sau mỗi 10 giây hoặc ngay khi có kết nối mạng trở lại (sự kiện `online`) hoặc khi mở lại ứng dụng.
- Tích hợp cờ trạng thái chưa đồng bộ `google_drive_unsynced_changes` giúp lưu giữ các thay đổi cục bộ và tự động đồng bộ khi online trở lại.
- Thiết kế **Chỉ báo đồng bộ động (Dynamic Sync Badge)** sinh động ngoài Header:
  - Khi bắt đầu sync ngầm, biểu tượng Wifi online đổi thành biểu tượng 2 mũi tên xoay màu vàng (`RefreshCw` animate-spin) trong tối thiểu 1 giây.
  - Khi sync thành công, hiển thị biểu tượng đám mây kèm dấu check xanh (`Check`) trong 3 giây để thông báo trực quan trước khi đưa về trạng thái bình thường.
  - Khi sync lỗi, hiển thị biểu tượng đám mây kèm dấu `X` đỏ ("Lỗi Sync").
- Thiết lập cơ chế **Giải quyết Xung đột dữ liệu (Conflict Resolution)**:
  - So sánh `timestamp` của bản sao lưu đám mây với thiết bị local trước khi đồng bộ để phát hiện xung đột nếu người dùng dùng nhiều thiết bị.
  - Tự động tải bản mới từ đám mây xuống local (Auto-Restore) nếu local không có sửa đổi nào mới (thiết bị mới đăng nhập).
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
