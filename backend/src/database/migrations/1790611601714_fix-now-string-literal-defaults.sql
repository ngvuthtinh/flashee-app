-- Up Migration
-- carts.updated_at and payments.created_at use DEFAULT 'now()' (a string literal).
-- Postgres casts this literal to a FIXED timestamp value at CREATE/ALTER TABLE time,
-- so every row inserted afterwards gets the same frozen timestamp instead of the real insert time.
-- DEFAULT now() (without quotes) is a function call that Postgres re-evaluates on every insert.
ALTER TABLE "carts" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT now();

-- Down Migration
ALTER TABLE "carts" ALTER COLUMN "updated_at" SET DEFAULT 'now()';
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT 'now()';