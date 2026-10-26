# Chi tiết từng Task (Notion Page Content)

## EPIC 1: INFRASTRUCTURE & DATABASE MIGRATION

### 1. Setup Migration & Seed System

**Mục tiêu:** Quản lý vòng đời thay đổi của Database mà không bao giờ xóa/drop database gốc.

**Checklist thực hiện:**
- [x] Tạo bảng hệ thống `_migrations` (các trường: `id`, `name`, `applied_at`).
- [x] Viết hàm quét thư mục migration: so khớp file trong thư mục với bản ghi trong DB, chỉ chạy các file chưa thực thi.
- [x] Đảm bảo mỗi lần thêm sửa bảng phải tạo file migration mới có đánh số thứ tự (hoặc timestamp).
- [x] Xây dựng script `seed` chuẩn để nạp dữ liệu mẫu ban đầu: Tài khoản Admin mặc định, danh sách Quốc gia (`country_code`), danh mục sản phẩm gốc.

### 2. Standardize Schema & Audit Fields

**Mục tiêu:** Đồng bộ hóa quy chuẩn đặt tên và trường theo dõi kiểm toán.

**Checklist thực hiện:**
- [x] Đổi tên toàn bộ cột khóa chính về dạng **`id`** (thay vì `user_id`, `product_id`, `order_id`...). Khóa ngoại vẫn giữ nguyên tiền tố bảng cha.
- [x] Bổ sung 2 cột **`created_at`** và **`updated_at`** cho tất cả các bảng.
- [x] Bổ sung cột **`country_code`** (chuẩn ISO 2–3 ký tự: `VN`, `US`...) vào bảng `countries`, đánh ràng buộc `NOT NULL` và `UNIQUE`.
- [x] Loại bỏ logic query tự do theo tên quốc gia, bắt buộc client gửi `country_code` từ danh sách chọn cố định.

## EPIC 2: AUTHENTICATION & USERS

### 3. Refactor Auth & Token Blacklist

**Mục tiêu:** Tăng cường an toàn xác thực và kiểm soát thu hồi phiên đăng nhập.

**Checklist thực hiện:**
- [x] Thống nhất thuật toán băm mật khẩu chuẩn (Argon2id hoặc Bcrypt với cost factor ≥ 12).
- [x] Tạo bảng `refresh_tokens`: Lưu refresh token đã cấp, gắn với `user_id`, thông tin thiết bị/User-Agent, thời gian hết hạn (`expires_at`).
- [ ] Xây dựng cơ chế `revoked_tokens` / `blacklist`: Lưu token bị hủy khi user logout hoặc đổi mật khẩu để từ chối truy cập ngay lập tức.

**Refresh token rotation (xong):**
- [x] A. Tạo `database/transaction.ts` với `withTransaction` (BEGIN/COMMIT/ROLLBACK + `client.release()`), export kiểu `Db = Pool | PoolClient`.
- [x] B. `refreshTokenRepository` nhận thêm tham số `db: Db = pool`; thêm `revokeAllByUserId`.
- [x] C. `authService.refresh`: không thấy → 401; đã revoke (reuse) → thu hồi toàn bộ token của user + 401; hết hạn → 401; hợp lệ → revoke cũ + phát mới trong 1 transaction.
- [x] D. Controller + route `POST /api/auth/refresh`.
- [x] E. `POST /api/auth/logout`: revoke refresh token hiện tại.
- [x] Test Postman: R1 → R2 OK; dùng lại R1 → 401 và R2 cũng bị revoke.
- [x] Rút `JWT_EXPIRES_IN` xuống ~15m sau khi `/refresh` chạy được.
- Ghi nhớ: 2 request refresh cùng 1 token đến cùng lúc có thể cùng qua bước kiểm tra (race) → xử lý bằng `SELECT ... FOR UPDATE` ở Stage 2.

### 4. User Profile & Ranking System

**Mục tiêu:** Phân tách dữ liệu tài khoản và quản lý hạng thành viên.

**Checklist thực hiện:**
- [ ] Tạo bảng `user_profiles`: Chứa thông tin cá nhân (họ tên, ngày sinh, avatar, bio...), liên kết 1-1 với `users`.
- [ ] Thiết kế cơ chế User Ranking (Bạc, Vàng, Kim Cương...) để áp dụng chính sách chiết khấu/ưu đãi.

### 11. Auth Cleanup & Input Validation

**Mục tiêu:** Xử lý các điểm yếu phát hiện khi review auth hiện tại; làm xong refresh token (Task 3) trước rồi mới làm task này.

**Checklist thực hiện:**
- [x] `login` trả `200` thay vì `201`.
- [x] Chống timing attack ở `login`: luôn chạy `bcrypt.compare` (hash giả khi email không tồn tại), gộp 2 nhánh `throw` thành một.
- [x] `DUMMY_HASH` tính 1 lần ở cấp module (không đặt trong hàm vì `hashSync` chặn event loop).
- [x] `user_agent`: cắt còn tối đa 255 ký tự (cột `varchar(255)`) bằng hàm `getUserAgent(req)` dùng chung cho register/login/refresh (refresh sẽ dùng khi làm phần D).
- [x] Tạo class `AppError` (statusCode + message) thay cho `const error: any = new Error(...)` lặp lại; `errorHandler` trả lỗi theo một shape thống nhất.
- [x] Middleware validate đầu vào (email, password, phone_number...) trả 400 kèm lỗi theo từng field; quyết định tự viết hay dùng `zod`. (tự viết: `validation/validate.ts` + `middleware/validateBody.ts`)
- [x] `register`: bắt lỗi UNIQUE (`23505`) khi 2 request cùng email → trả 400 thay vì 500 (race check-then-act; UNIQUE trong DB là trọng tài cuối).
- [ ] (Stage 4) `protect` chưa chặn được token đã thu hồi: cân nhắc access token ngắn hạn + blacklist/`jti` (có thể dùng cache Redis để tra nhanh).

### 12. Google OAuth 2.0 Login

**Mục tiêu:** Cho phép đăng nhập bằng tài khoản Google, làm sau khi xong Task 11.

**Quyết định thiết kế (ADR tóm tắt):**
- Google chỉ xác thực danh tính; sau đó hệ thống cấp access/refresh token **của chính mình** (luồng OAuth hội tụ về cùng `issueRefreshToken` với login mật khẩu).
- Lưu danh tính ở bảng riêng `oauth_accounts (provider, provider_user_id = sub)`, không thêm cột vào `users`; `users.password` và `phone_number` nullable.
- Email đã đăng ký bằng mật khẩu → **từ chối** (không tự gộp), vì chưa có email verification nên tự gộp mở lỗ hổng pre-hijacking. Chỉ chấp nhận khi Google trả `email_verified = true`.
- Giao phiên sau callback bằng **cookie `httpOnly`** (refresh token), không đặt token trên URL.

**Đã xong:**
- [x] Tìm hiểu luồng Authorization Code và vai trò của `state` chống CSRF.
- [x] Quyết định mô hình lưu danh tính (bảng `oauth_accounts`) và chính sách email trùng (từ chối).
- [x] Migration `oauth_accounts`, nới `users.password`/`phone_number` thành nullable.
- [x] `GET /api/auth/google` (redirect + cookie `oauth_state`), `googleOAuthService` (`buildAuthUrl`, `exchangeCode`).
- [x] `GET /api/auth/google/callback`: kiểm tra `state`, đổi code, `authService.loginWithGoogle` (tạo user + oauth_account + refresh token trong 1 transaction), đặt cookie `refresh_token`, redirect về `FRONTEND_URL`.
- [x] `oauthAccountRepository`, `userRepository.createOAuthUser`, `cookie-parser`, `GET /api/auth/me`.
- [x] Migration chuẩn hoá `created_at`/`updated_at` (DEFAULT `now()`, thêm `created_at` cho 8 bảng còn thiếu).

**Còn lại để đóng Task 12 (theo thứ tự):**
- [ ] Google Cloud Console: redirect URI khớp từng ký tự `http://localhost:3000/api/auth/google/callback`; thêm email vào *Test users* nếu consent screen đang ở chế độ Testing.
- [ ] `/refresh` và `/logout` nhận refresh token từ **body hoặc cookie** `refresh_token`; bỏ `validateBody(refreshSchema)` ở hai route. Khi token đến từ cookie: `/refresh` đặt lại cookie bằng token mới (rotation) và chỉ trả `accessToken` trong body.
- [ ] `/logout` xoá cookie `refresh_token` (`clearCookie` với cùng `path: '/api/auth'`); không có token vẫn trả 200 (idempotent).
- [ ] Gom tuỳ chọn cookie (`httpOnly`, `sameSite`, `secure`, `path`, `maxAge`) thành một hằng dùng chung cho đặt/xoá cookie.
- [ ] CORS: `cors({ origin: FRONTEND_URL, credentials: true })` thay cho `cors()` đang mở mọi origin.
- [ ] `register` chạy trong `withTransaction` (tạo user + refresh token); `create` đã nhận `db`, chỉ cần bọc lại.
- [ ] Test thật trên trình duyệt: `/api/auth/google` → đăng nhập Google → có cookie `refresh_token` → `/refresh` ra access token; email đã đăng ký mật khẩu bị từ chối; đăng nhập Google lần hai vào thẳng; user Google gọi `/login` bằng mật khẩu bị 401.
- [ ] Cập nhật `dbdiagram.md` (`created_at` cho 8 bảng, `oauth_accounts`, nullable của `users`), viết ADR đầy đủ cho các quyết định trên.
- [ ] Sửa nhỏ: `method: 'Post'` → `'POST'` trong `googleOAuth.ts`.

**Ghi nhớ / để sau:**
- Hai callback lần đầu của cùng một người chạy đồng thời có thể cùng qua bước kiểm tra rồi một cái bị UNIQUE từ chối (500) → xử lý bằng bắt `23505` hoặc locking ở Stage 2.
- `/login` và `/register` vẫn trả refresh token trong JSON body; chuyển sang cookie để hai luồng hội tụ hoàn toàn (Stage 4: cookie session).
- Lưu tên/avatar Google vào `user_profiles` (Task 4); hiện chỉ dùng `name` cho `users.user_name`.
- Task 3: blacklist access token (`jti`); đổi mật khẩu/quên mật khẩu/email verification hoãn lại. Khi có email verification mới cân nhắc lại chính sách gộp tài khoản.

## EPIC 3: CATALOG & INVENTORY

### 5. Refactor Product - Variant & SKU Logic

**Mục tiêu:** Chuẩn hóa luồng quản lý tồn kho và danh mục bán hàng.

**Checklist thực hiện:**
- [ ] Định nghĩa rõ kiến trúc: `product_variants` là sub-entity phụ thuộc trực tiếp vào `products`.
- [ ] Phân định rõ phạm vi:
  - **`Product ID`:** Public ra ngoài, dùng cho khách hàng xem, đặt hàng và đo lường doanh số bán.
  - **`SKU`:** Mã nội bộ quản lý kho vật lý cho từng biến thể (màu/size), che giấu với người dùng cuối.
- [ ] Đảm bảo `cart_items` trỏ đúng vào thực thể sản phẩm/biến thể có thể mua được.

## EPIC 4: SHOPPING CART & PERFORMANCE

### 6. Cart Caching Layer

**Mục tiêu:** Giảm tải I/O ghi đĩa liên tục vào Database mỗi khi khách thêm/sửa món trong giỏ.

**Checklist thực hiện:**
- [ ] Thiết lập Redis hoặc cơ chế In-memory cache làm lớp đệm hứng thao tác giỏ hàng.
- [ ] Xây dựng cơ chế đồng bộ (Sync/Flush) dữ liệu từ Cache xuống bảng `carts` / `cart_items` trong PostgreSQL (khi sang màn hình Checkout hoặc sau một khoảng thời gian).
- [ ] Xử lý trường hợp Cache miss (đọc từ Database đẩy ngược lên Cache).

### 7. Review & Optimize Indexes

**Mục tiêu:** Đảm bảo tốc độ truy vấn tối ưu và tránh lãng phí tài nguyên ghi.

**Checklist thực hiện:**
- [ ] Xóa các Single Index độc lập trên cột `price`.
- [ ] Rà soát lại Compound Index: Chỉ đánh trên các trường xuất hiện liên tục trong mệnh đề `WHERE` kết hợp `ORDER BY`.
- [ ] Ưu tiên Compound Unique Index cho các cặp dữ liệu chống trùng lặp (ví dụ: `cart_id` + `product_variant_id`).
- [ ] Áp dụng quy tắc Leftmost Prefix: Đặt trường có tần suất lọc cao nhất lên đầu tiên trong cụm index.

## EPIC 5: ORDERS, PAYMENTS & MARKETING

### 8. Create Transactions Table

**Mục tiêu:** Lưu vết đối soát tài chính chi tiết với các cổng thanh toán.

**Checklist thực hiện:**
- [ ] Tạo bảng `transactions`: Chứa `id`, `payment_id`, `transaction_code`, `gateway_name`, `amount`, `status`, `raw_response`, `created_at`.
- [ ] Lưu toàn bộ payload callback/webhook từ cổng thanh toán vào `raw_response` để phục vụ đối soát khi có tranh chấp.

### 9. Multi-level Reviews (Sub-comments)

**Mục tiêu:** Mở rộng tương tác đánh giá giữa người mua và shop.

**Checklist thực hiện:**
- [ ] Thêm cột `parent_id` (tự trỏ vào `reviews.id`) vào bảng `reviews` để hỗ trợ shop trả lời bình luận.
- [ ] Giữ nguyên ràng buộc: Khách hàng chỉ được tạo 1 review gốc cho mỗi món hàng đã mua (`order_item_id`).

### 10. Campaign & Promotion Module

**Mục tiêu:** Quản lý các chương trình khuyến mãi theo chiến dịch marketing.

**Checklist thực hiện:**
- [ ] Tạo bảng `campaigns` (Chiến dịch marketing: ngày bắt đầu, ngày kết thúc, ngân sách).
- [ ] Tạo bảng `promotions` / `vouchers` liên kết trực thuộc `campaign_id` để quản lý mã giảm giá theo từng đợt khuyến mãi.
