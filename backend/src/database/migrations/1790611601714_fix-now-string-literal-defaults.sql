-- Up Migration
-- carts.updated_at và payments.created_at đang dùng DEFAULT 'now()' (string literal).
-- Postgres cast literal này thành 1 giá trị timestamp CỐ ĐỊNH ngay lúc chạy CREATE/ALTER TABLE,
-- nên mọi row insert sau đó đều nhận cùng 1 mốc thời gian đóng băng thay vì thời điểm insert thật.
-- DEFAULT now() (không có dấu nháy) là gọi function, được Postgres re-evaluate mỗi lần insert.
ALTER TABLE "carts" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT now();

-- Down Migration
ALTER TABLE "carts" ALTER COLUMN "updated_at" SET DEFAULT 'now()';
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT 'now()';