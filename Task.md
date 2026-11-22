# Chi tiết từng Task (Notion Page Content)

## Lộ trình thực hiện tiếp theo

Nguyên tắc: làm CRUD trước, **gắn authorization vào từng endpoint ngay lúc viết** (không làm authorization thành một giai đoạn riêng). Mỗi tính năng dạy một khái niệm.

Mỗi endpoint mới hỏi 4 câu: công khai? / cần đăng nhập (`protect`)? / chỉ chủ sở hữu (kiểm tra ownership ở service, chống IDOR)? / chỉ admin (`protect` + `restrictTo('ADMIN')`)? Mặc định từ chối, route công khai phải chọn có chủ đích.

- [ ] 1. **Thiết kế catalog** (Task 5): `products`, `product_variants`, SKU; `product_variants` là sub-entity của `products`. (Schema đã có ràng buộc + `is_active`, còn phần phân định `Product ID` / SKU và `cart_items`.)
- [ ] 2. **API sản phẩm**: `GET` danh sách + chi tiết (công khai, học **pagination** offset vs cursor) và `POST/PUT/DELETE` cho admin (`restrictTo('ADMIN')`, dùng lại validation tự viết). Học REST và error shape nhất quán (Stage 1).
- [ ] 3. **Route admin ban / thu hồi session** (xem Task 3): nhỏ, dùng lại `sessionService.revokeAllByUser`, là `restrictTo` thứ hai; chốt số phận `/logout-all`.
- [ ] 4. **Giỏ hàng** (Task 6): lần đầu gặp **ownership / IDOR** thật (mỗi người chỉ thấy giỏ của mình).
- [ ] 5. **Đơn hàng + checkout** (Task 8): transaction, locking, race condition, isolation level (Stage 2, lõi flash sale).

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

### 13. Run PostgreSQL & Redis in Docker

**Mục tiêu:** Môi trường dev giống hệt nhau giữa PC và laptop, dựng lại bằng một lệnh, không cài Postgres/Redis thẳng vào Windows.

**Checklist thực hiện:**
- [x] `backend/docker-compose.yml`: service `redis` (redis:7-alpine, AOF + volume `redis-data`) và `postgres` (postgres:18, volume `postgres-data` gắn ở `/var/lib/postgresql`, healthcheck `pg_isready`, biến `POSTGRES_USER/PASSWORD/DB` lấy từ `backend/.env` dùng chung với app, cổng `${DB_PORT}` = `5433` để không đụng Postgres native ở 5432).
- [x] Dựng DB trống trong Docker: `npm run db:migrate` (16 migration chạy sạch từ đầu) + `npm run db:seed`; dữ liệu dev cũ ở Postgres native được bỏ (không chuyển sang). Backend kết nối Docker qua `DB_PORT=5433`, `.env.example` đã cập nhật.
- [x] Cập nhật `CLAUDE.md` mục "Local DB" (đã ghi Postgres chạy trong Docker, cổng 5433).
- [ ] Laptop: `git pull`, sửa `backend/.env` (`DB_PORT=5433`, user/password/db khớp compose), `docker compose up -d`, `npm run db:migrate`, `npm run db:seed`.
- [x] Viết phần "Getting started" cho `README.md`: `copy .env.example .env` rồi điền giá trị riêng (cả `JWT_SECRET` và Google OAuth), `docker compose up -d`, migrate, seed, `npm run dev`.
- [ ] (Tuỳ chọn) Tắt service Postgres native `postgresql-x64-18` (đặt Startup type = Manual) khi mọi thứ ổn; nó hiện chỉ giữ cổng 5432 và chứa dữ liệu dev cũ.

**Ghi nhớ:**
- `POSTGRES_USER/PASSWORD/DB` chỉ áp dụng **lần khởi tạo volume đầu tiên**: đổi `.env` sau đó không đổi tài khoản trong DB. Muốn đổi dùng `ALTER USER ... PASSWORD ...` hoặc `docker compose down -v` (mất dữ liệu). Tài khoản và mật khẩu là thật (Postgres vẫn kiểm tra), chỉ khác là mình tự chọn lúc tạo container.
- Dữ liệu nằm trong volume trên từng máy, **không** nằm trong git: người clone về tự dựng bằng migrate + seed (dữ liệu bạn tự tạo lúc dev không đi theo).
- Terminal VS Code mở trước lúc cài Docker không nhận lệnh `docker`: dùng PowerShell ngoài hoặc mở lại VS Code. Chạy `docker compose` phải đứng trong `backend`.
- Công cụ xem trực quan: RedisInsight / extension Redis cho VS Code (kết nối `127.0.0.1:6379`, không user/mật khẩu), DBeaver hoặc dbdiagram.io (dán `dbdiagram.md`) cho Postgres.

### 14. Tách cleanup job thành cron chạy song song với backend

**Mục tiêu:** Dọn dữ liệu chết (`sessions`) bằng một tiến trình **độc lập** với API, để có nhiều lựa chọn hơn khi deploy.

**Vì sao tách:** trước đây `cleanupService.start()` chạy bằng `setInterval` **trong chính API process** (`index.ts`). Hệ quả: nhiều instance API thì job chạy trùng; job gắn với vòng đời của API (API restart/deploy thì lịch dọn bị reset); không cho phép scale API và job riêng; không tận dụng được scheduler của nền tảng (cron, CronJob, Task Scheduler).

**Checklist thực hiện:**
- [x] Entry point độc lập `backend/src/jobs/cleanup.ts`, chạy **một lần rồi thoát** (run-once), script `npm run job:cleanup`; dùng `cleanupService.run`.
- [x] Gỡ `cleanupService.start()` và `setInterval` khỏi `index.ts` (API không còn tự dọn).
- [x] Job đóng kết nối `pool` trong `finally` để process thoát ngay (không import Redis vì không cần); lỗi thì `process.exitCode = 1`; luôn log số session đã xoá.
- [x] Số ngày giữ session đã revoke ra cấu hình: `CLEANUP_REVOKED_RETENTION_DAYS` (mặc định 7) trong `.env` / `.env.example`. Chu kỳ không còn trong code vì do bộ lập lịch quyết định.
- [x] Chống chạy trùng: `pg_try_advisory_lock(727001)` trong `cleanupService` (lấy và nhả bằng cùng một `client`); chạy chồng thì bản sau bỏ qua; khoá tự nhả khi connection đứt.
- [ ] **Bật lịch chạy (chưa làm, có chủ đích):** hiện cleanup **không tự chạy**, chạy tay bằng `npm run job:cleanup`. Khi deploy chọn bộ lập lịch theo nền tảng: dev (Windows Task Scheduler chạy `npm run job:cleanup` mỗi 6 giờ, nhớ đặt thư mục làm việc là `backend`); VM + Docker Compose (service vòng lặp hoặc cron gọi `docker compose run --rm`); Kubernetes CronJob (`concurrencyPolicy: Forbid`); scheduler của nền tảng (Railway, Render, Cloud Run Jobs...); hoặc `pg_cron` nếu dọn hoàn toàn trong DB. Docker không tự chạy theo lịch, cần có bộ lập lịch. Dockerfile cho backend sẽ viết khi chọn nơi deploy.
- [x] Cập nhật `CLAUDE.md` (mục Cleanup job), `README.md`, và ghi chú cleanup ở Task 12.

**Ghi nhớ:**
- Câu `DELETE` hiện tại **idempotent** (chạy lặp vẫn đúng) nên chạy trùng chỉ thừa chứ không sai.
- Khi bảng lớn, nên xoá theo **lô** (batch, `LIMIT`) để không giữ lock quá lâu.
- Sau khi gộp refresh token vào `sessions` (Task 15), job chỉ còn dọn một bảng bằng một câu `DELETE` (session hết hạn hoặc đã revoke quá 7 ngày).
- Run-once là lựa chọn để mọi nơi deploy đều dùng được: cùng một lệnh, chỉ đổi bộ lập lịch; exit code cho scheduler biết thành công hay lỗi.
- Lớp chống chạy chồng ở DB (advisory lock) bổ sung cho lớp ở nền tảng (ví dụ `concurrencyPolicy: Forbid` của CronJob), còn bảo vệ được cả khi ai đó chạy tay lúc job đang chạy.

### 15. Gộp refresh token vào session & xoay có ngưỡng

**Mục tiêu:** Theo góp ý của anh mentor: mỗi session chỉ có **một** refresh token đang sống, và F5 không được làm cấp lại refresh token.

**Vấn đề trước đó:** `/refresh` xoay token ở mọi lần gọi mà frontend gọi nó mỗi lần F5 (access token nằm trong RAM), nên mỗi F5 ghi thêm một dòng `refresh_tokens` và đặt cookie mới; bảng phình ra và phải có job dọn.

**Đã chốt:** một user có nhiều session; mỗi session có đúng một refresh token đang sống (nằm ngay trong dòng `sessions`); cùng thiết bị, cùng tài khoản đăng nhập lại thì thêm một session mới; hướng A (xoay có ngưỡng).

**Checklist thực hiện:**
- [x] Migration `merge-refresh-tokens-into-sessions`: thêm `token_hash` (UNIQUE), `previous_token_hash` (có index), `token_issued_at`, `expires_at` vào `sessions` và bỏ bảng `refresh_tokens` (xoá hết session cũ nên mọi người đăng nhập lại; chỉ ổn ở DB dev). `Down` dựng lại bảng cũ.
- [x] `sessionRepository`: `create` nhận `tokenHash` + `expiresAt`; thêm `findByTokenHash`, `findByPreviousTokenHash`, `rotate`; `deleteDead` còn một câu `DELETE`. Bỏ `RefreshToken` repository và model.
- [x] `rotate` là compare-and-swap (optimistic concurrency): `UPDATE sessions SET previous_token_hash = token_hash, token_hash = <mới>, ... WHERE id = $1 AND token_hash = <cũ> AND revoked_at IS NULL`, trả `true` nếu `rowCount === 1`. Không cần transaction vì một câu `UPDATE` đã nguyên tử.
- [x] `authService`: `startSession` tạo session kèm refresh token bằng một `INSERT`; `refresh` tra theo `token_hash`, nếu không thấy thì tra `previous_token_hash` (dùng lại token cũ thì thu hồi session + 401), chỉ xoay khi token cũ hơn `REFRESH_ROTATE_AFTER_MS` (1 giờ), `rotate` thua cuộc thì chỉ trả access token; `logout` tìm session theo `token_hash`; `refresh` bỏ tham số `userAgent`.
- [x] `sessionService.revoke` / `revokeAllByUser` chỉ còn một bảng (bỏ transaction), vẫn xoá cache Redis sau khi Postgres xong.
- [x] Controller `/refresh`: chỉ `res.cookie(...)` khi vừa xoay (`result.refreshToken` có giá trị); nhánh body trả `refreshToken` chỉ khi vừa xoay.
- [ ] Test thật: F5 nhiều lần thì `token_hash` không đổi và không có `Set-Cookie` mới; `UPDATE sessions SET token_issued_at = now() - interval '2 hours'` rồi F5 thì token xoay và `previous_token_hash` nhận hash cũ; dùng lại token cũ thì session bị thu hồi; logout rồi F5 về trang đăng nhập.
- [ ] Chạy migration trên laptop (xem Task 13).

**Ghi nhớ:**
- Đánh đổi: phát hiện đánh cắp yếu hơn (chỉ nhớ **một** thế hệ token trước; trong khoảng ngưỡng hai bên dùng chung một token không bị phát hiện; không còn lịch sử token để điều tra). Ngưỡng nhỏ thì gần xoay-mỗi-lần, ngưỡng lớn thì ít ghi hơn.
- `token_issued_at` ghi bằng `new Date()` của Node (không dùng `NOW()`) để cùng nguồn đồng hồ với phép so sánh `Date.now()`, vì cột `timestamp` không có múi giờ.
- Hai tab cùng xoay một lúc: tab thua chỉ nhận access token (cookie mới đã do tab kia đặt). Tab còn dùng token cũ đúng lúc vừa xoay có thể bị coi là "dùng lại" và bị revoke session (hiếm, có thể thêm khoảng ân hạn sau).
- Cần ghi vào ADR: lý do gộp, giới hạn "nhớ một thế hệ", ngưỡng đã chọn.

## EPIC 2: AUTHENTICATION & USERS

### 3. Refactor Auth & Token Blacklist

**Mục tiêu:** Tăng cường an toàn xác thực và kiểm soát thu hồi phiên đăng nhập.

**Checklist thực hiện:**
- [x] Thống nhất thuật toán băm mật khẩu chuẩn (Argon2id hoặc Bcrypt với cost factor ≥ 12).
- [x] Lưu refresh token (chỉ hash) gắn với `user_id`, thông tin thiết bị/User-Agent, thời gian hết hạn (`expires_at`): ban đầu là bảng `refresh_tokens`, sau đó **gộp vào `sessions`** (mỗi session một refresh token, xem Task 15).
- [x] Cơ chế thu hồi access token: làm blacklist `jti` trước (Postgres, rồi chuyển sang Redis `revoked:<jti>` + TTL), sau đó **thay bằng session** (xem phần "Session-based revocation" bên dưới) vì blacklist không thu hồi hàng loạt được và mất dữ liệu Redis thì token sống lại. Đã bỏ `jti`/`jwtid`, `revokedTokenRepository` và bảng `revoked_tokens`.

**Refresh token rotation (xong):**
- [x] A. Tạo `database/transaction.ts` với `withTransaction` (BEGIN/COMMIT/ROLLBACK + `client.release()`), export kiểu `Db = Pool | PoolClient`.
- [x] B. (lịch sử) `refreshTokenRepository` nhận thêm tham số `db: Db = pool`; thêm `revokeAllByUserId`. Repository này đã bỏ khi gộp vào `sessions` (Task 15).
- [x] C. `authService.refresh` (theo mô hình sau khi gộp, Task 15): tra theo `token_hash`, không thấy thì tra `previous_token_hash` (dùng lại token cũ → thu hồi **session** + 401); session đã revoke hoặc hết hạn → 401; hợp lệ → luôn cấp access token mới (cùng `sid`), chỉ xoay refresh token khi đã cũ hơn ngưỡng 1 giờ.
- [x] D. Controller + route `POST /api/auth/refresh`.
- [x] E. `POST /api/auth/logout`: thu hồi session của refresh token (hoặc `sid` của access token nếu không có refresh token), nên access token cũ chết ngay.
- [x] Test Postman: R1 → R2 OK; dùng lại R1 → 401 và R2 cũng bị revoke.
- [x] Rút `JWT_EXPIRES_IN` xuống ~15m sau khi `/refresh` chạy được.
- Ghi nhớ: race khi 2 request cùng xoay một refresh token được xử lý bằng `UPDATE ... WHERE token_hash = <cũ>` (optimistic concurrency, Task 15): request thua chỉ nhận access token. `SELECT ... FOR UPDATE` (pessimistic) vẫn là chủ đề so sánh ở Stage 2.

**Session-based revocation (session-in-JWT, thu hồi access token ngay):**

Thiết kế: JWT chứa `sid`; session là một dòng trong Postgres (nguồn sự thật), Redis là cache-aside (`session:<sid>` → `userId`, TTL 300s). Allow-list: "không có trong cache" nghĩa là *chưa biết* nên hỏi Postgres, nhờ đó Redis mất dữ liệu không làm ai bị đăng xuất hay token đã thu hồi sống lại. Một user có nhiều session, mỗi session có đúng một refresh token đang sống (nằm ngay trong dòng `sessions`, xem Task 15; trước đó là bảng `refresh_tokens` nhiều dòng cho mỗi session).
- [x] Migration `create-sessions`: bảng `sessions (id = sid, user_id, user_agent, revoked_at, created_at, updated_at)` + trigger + index `user_id`; thêm `refresh_tokens.session_id` NOT NULL (FK `ON DELETE CASCADE`, đã xoá refresh token cũ khi migrate, chỉ ổn ở DB dev). Cột và bảng này sau đó được thay bởi migration `merge-refresh-tokens-into-sessions` (Task 15).
- [x] Model `Session`; `sessionRepository` (`create`, `findActiveById`, `revoke`, `revokeAllByUserId` trả danh sách `sid`); `sessionCacheRepository` (`get`/`set`/`delete`); (`refreshTokenRepository` thời đó nhận `sessionId` và có `revokeAllBySessionId`; về sau được gộp vào `sessionRepository`, Task 15).
- [x] `startSession` trong `authService`: login/register/Google tạo session kèm refresh token (một `INSERT`; `register` vẫn nằm trong transaction cùng với việc tạo user); `generateToken(userId, role, sessionId)` đưa `sid` vào JWT; `/refresh` giữ nguyên `session_id` và kiểm tra session còn hiệu lực (đọc thẳng Postgres, không qua cache vì hiếm và là cổng cấp token mới).
- [x] `protect` gọi `sessionService.isActive(sid, userId)`: Redis hit thì so `userId`; miss thì hỏi Postgres rồi nạp lại cache; token không có `sid` bị từ chối. `req.user` có `sid` (`types/express.d.ts`).
- [x] `sessionService.revoke(sessionId)` / `revokeAllByUser(userId)`: cập nhật Postgres (một bảng sau khi gộp refresh token, không cần transaction), **sau khi xong** mới `DEL` cache Redis.
- [x] `/logout` thu hồi session; reuse detection thu hồi đúng session bị lộ (không phải mọi session của user); `POST /api/auth/logout-all` (có `protect`) thu hồi mọi session của chính người gọi.
- [x] Chịu lỗi Redis: `disableOfflineQueue: true` để lệnh lỗi nhanh thay vì treo; lỗi đọc cache = miss (hỏi Postgres), lỗi ghi/xoá cache chỉ log. **Không bắt lỗi Postgres** (nuốt lỗi trong transaction làm `COMMIT` thành `ROLLBACK` âm thầm).
- [x] Dọn blacklist cũ: bỏ `jti`/`jwtid`, `RevokedToken.ts`, kiểm tra blacklist trong `protect`; migration `drop-revoked-tokens`.
- [x] Migration `drop-revoked-tokens` và `create-sessions` đã chạy trên PC (DB Docker mới, 16 migration, không còn bảng `revoked_tokens`). Laptop: xem Task 13.
- [x] Đã xác nhận thật (PC): đăng ký tạo 1 session + refresh token cùng `session_id`; `/refresh` bằng cookie xoay refresh token nhưng giữ nguyên session; access token mang `sid` (hạn 900s, không còn `jti`); key `session:<sid>` xuất hiện trong Redis (RedisInsight) với giá trị là `userId` và TTL ~300.
- [x] Test thật (đã chạy xong): logout → `/me` bằng token cũ 401 ngay; hai session rồi `/logout-all` → cả hai 401; dùng lại refresh token cũ → session bị thu hồi; `docker compose stop` (Redis) → `/me` vẫn 200 qua Postgres, log `Session cache read failed`; `UPDATE sessions SET revoked_at = now()` trực tiếp thì `/me` vẫn 200 cho đến khi `DEL session:<sid>` hoặc hết TTL.
- [ ] **Admin thu hồi session (ban user):** chỉ dành cho admin, không làm nút "Log out all devices" cho user thường ở frontend. Cần route cho admin (`protect` + `restrictTo('ADMIN')`) nhận `userId` đích rồi gọi `sessionService.revokeAllByUser`, kèm cờ khoá/ban user (chặn login và refresh). Hiện `POST /logout-all` chỉ thu hồi session của chính người gọi.
- Ghi nhớ: `DEL` cache lỗi lúc thu hồi thì cache cũ còn "hợp lệ" tối đa 300s (TTL là lưới an toàn); cache-aside có race giữa lúc nạp lại và lúc thu hồi (xử lý ở Stage 2); sau khi Redis restart nhiều request cùng miss dồn xuống Postgres (thundering herd, Stage 3); session có `expires_at` (30 ngày, gia hạn mỗi lần xoay refresh token); `sessions` có job dọn (`npm run job:cleanup`, xem Task 14, chưa bật lịch).

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
- [x] `protect` chặn được token đã thu hồi bằng cách kiểm tra session (`sid`, xem Task 3); Redis cache-aside giúp không phải query Postgres ở mỗi request.

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
- [x] `/refresh` và `/logout` nhận refresh token từ **body hoặc cookie** `refresh_token`; token từ cookie thì `/refresh` đặt lại cookie (rotation) và chỉ trả `accessToken` trong body.
- [x] `/logout` xoá cookie `refresh_token` (idempotent: không có token vẫn trả 200) và thu hồi session (access token cũ chết ngay).
- [x] Gom tuỳ chọn cookie vào `config/cookies.ts` (`refreshCookieOptions`, `clearRefreshCookieOptions`) dùng chung cho đặt/xoá cookie.
- [x] CORS: `cors({ origin: FRONTEND_URL, credentials: true })`.
- [x] `register` chạy trong `withTransaction` (tạo user + refresh token).
- [x] Sửa `method: 'Post'` → `'POST'` trong `googleOAuth.ts`.
- [x] Frontend: trang `LoginPage`, `HomePage`, `api.ts`.
- [x] `/login` và `/register` đặt refresh token vào cookie `httpOnly` (cùng `refreshCookieOptions` với Google) và **không** trả nó trong JSON; frontend bỏ `localStorage`, `/refresh` và `/logout` không gửi body (cookie tự đi), dọn khoá cũ `flashee.refreshToken` còn sót. Đã kiểm tra: đăng ký xong F5 vẫn đăng nhập, response không có `refreshToken`.
- [x] Kết nối Google vào tài khoản đang đăng nhập: `POST /api/auth/google/link` (`protect`) đặt cookie `oauth_state` + `oauth_link` (JWT `purpose`/`userId`/`state`, 10 phút) và trả URL Google; callback verify `oauth_link` rồi gọi `authService.linkGoogle` (idempotent; 409 nếu Google đã gắn user khác hoặc user đã có Google khác). Thêm `AppError.conflict`, `findByUserAndProvider`, cookie OAuth trong `config/cookies.ts`, nút "Connect Google" ở `HomePage`.
- [x] Redis: `backend/docker-compose.yml` (redis:7-alpine, AOF + volume), `config/redis.ts` (kết nối trước `app.listen`, `disableOfflineQueue`), dùng làm cache session (xem Task 3).

**Còn lại để đóng Task 12:**
- [x] Google Cloud Console: redirect URI khớp `http://localhost:3000/api/auth/google/callback` và email đã nằm trong *Test users* (đã chứng minh bằng 2 bài test trình duyệt ngay bên dưới, đều qua được Google).
- [x] Test thật trên trình duyệt: `/api/auth/google` → đăng nhập Google → có cookie `refresh_token` → `/refresh` ra access token; email đã đăng ký mật khẩu bị từ chối; đăng nhập Google lần hai vào thẳng; user Google gọi `/login` bằng mật khẩu bị 401.
- [x] Test thật luồng kết nối: đăng nhập bằng mật khẩu → "Connect Google" → có dòng trong `oauth_accounts` → đăng xuất → "Continue with Google" vào đúng tài khoản cũ; kết nối lần hai không lỗi; Google đã gắn user khác bị `?link_error=`.
- [x] Test thật hướng session (xem checklist ở Task 3). Migration `drop-revoked-tokens` / `create-sessions` trên laptop: xem Task 13.
- [x] Cập nhật `dbdiagram.md`: thêm `sessions`, `refresh_tokens.session_id`, `created_at` cho 8 bảng thiếu và `DEFAULT now()` cho các bảng đã chuẩn hoá; không có `revoked_tokens` vì đã bỏ bảng này.
- [ ] Viết ADR đầy đủ cho các quyết định ở trên (mô hình `oauth_accounts`, từ chối gộp email, refresh token qua cookie, link Google bằng cookie `oauth_link`, session-in-JWT với Postgres làm nguồn sự thật + Redis cache-aside thay cho blacklist `jti`).

**Ghi nhớ / để sau:**
- Hai callback lần đầu của cùng một người chạy đồng thời có thể cùng qua bước kiểm tra rồi một cái bị UNIQUE từ chối (500) → xử lý bằng bắt `23505` hoặc locking ở Stage 2.
- `readRefreshToken` vẫn nhận refresh token từ **body** (cho client không phải trình duyệt như Postman/mobile); có thể bỏ nhánh này để chỉ dùng cookie. Access token vẫn gửi bằng header `Authorization` (Stage 4: cân nhắc cookie-based session).
- Bảo mật trình duyệt: refresh token không còn ở `localStorage` (giảm rủi ro XSS đánh cắp token 30 ngày); CSRF được che bởi header Bearer (access token) + cookie `SameSite=Lax` (refresh/logout). Chưa có CSP và `helmet`. Khi làm review/bình luận phải tránh render HTML thô (stored XSS). Khi chuyển sang cookie-based session phải thêm bảo vệ CSRF (CSRF token hoặc kiểm tra `Origin`).
- Lưu tên/avatar Google vào `user_profiles` (Task 4); hiện chỉ dùng `name` cho `users.user_name`.
- [x] Dọn `sessions`: ban đầu `cleanupService` chạy bằng `setInterval` trong API, sau đó **tách thành job riêng chạy một lần** (`npm run job:cleanup`, có advisory lock, xem Task 14) và API không còn tự dọn. Job xoá session hết hạn hoặc đã revoke quá 7 ngày. **Chưa bật lịch**, chạy tay khi cần.
- Chưa có "Unlink Google": khi làm phải chặn user chỉ có Google (không có mật khẩu) tự khoá mình ra ngoài.
- Hai request kết nối Google cùng lúc có thể cùng qua bước kiểm tra rồi một cái bị UNIQUE từ chối (500) → bắt `23505` hoặc locking ở Stage 2.
- Redis chết giữa lúc server chạy đã được xử lý: `disableOfflineQueue: true` + lỗi cache coi như miss, `protect` vẫn chạy qua Postgres (chậm hơn). Đã thử thật bằng `docker compose stop` (xem Task 3).
- [x] Lỗi của luồng Google đưa **mã lỗi** lên query string (`?link_error=`, `?error=`), không còn `err.message`: `AppError.withCode(...)` (`google_failed`, `email_taken`, `email_not_verified`, `google_taken`, `google_already_linked`; callback thêm `google_denied`, `invalid_state`), lỗi chưa gắn mã rơi về `google_failed`; frontend map mã sang câu hiển thị (`App.tsx`, `HomePage.tsx`).
- Đổi mật khẩu/quên mật khẩu/email verification hoãn lại (đổi mật khẩu sẽ cần `sessionService.revokeAllByUser` để thu hồi mọi session và refresh token). Khi có email verification mới cân nhắc lại chính sách gộp tài khoản.

## EPIC 3: CATALOG & INVENTORY

### 5. Refactor Product - Variant & SKU Logic

**Mục tiêu:** Chuẩn hóa luồng quản lý tồn kho và danh mục bán hàng.

**Đã xong (mới ở mức schema):**
- [x] Migration `add-catalog-constraints`: `products.is_active` và `product_variants.is_active` (soft delete / ẩn sản phẩm, mặc định `true`); `CHECK (price >= 0)` và `CHECK (stock_quantity >= 0)` trên `product_variants` (DB là chốt chặn cuối chống bán âm kho); `UNIQUE NULLS NOT DISTINCT (product_id, color, size)` chống trùng biến thể (kể cả khi `color`/`size` là NULL). Model `Product`/`ProductVariant` có thêm `is_active`.
- Chưa có repository, service, controller, route nào cho catalog (backend mới chỉ có `auth`). Bước kế tiếp là Roadmap #2 (API đọc sản phẩm).

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
- [ ] Thiết lập Redis hoặc cơ chế In-memory cache làm lớp đệm hứng thao tác giỏ hàng. (Hạ tầng Redis đã có: `backend/docker-compose.yml`, `config/redis.ts`.)
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
