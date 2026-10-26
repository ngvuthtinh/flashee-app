-- Up Migration
-- 1. created_at already exists but has no default (users also stays NOT NULL)
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "addresses" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "cart_items" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT now();

-- 2. updated_at has no default (the set_updated_at trigger only fires on UPDATE, not INSERT)
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT now();

-- 3. created_at is missing entirely; existing rows get the time of this migration
ALTER TABLE "carts" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "categories" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "countries" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "order_items" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "product_category" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "product_images" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "product_variants" ADD COLUMN "created_at" timestamp DEFAULT now();
ALTER TABLE "user_address" ADD COLUMN "created_at" timestamp DEFAULT now();

-- Down Migration
ALTER TABLE "user_address" DROP COLUMN "created_at";
ALTER TABLE "product_variants" DROP COLUMN "created_at";
ALTER TABLE "product_images" DROP COLUMN "created_at";
ALTER TABLE "product_category" DROP COLUMN "created_at";
ALTER TABLE "order_items" DROP COLUMN "created_at";
ALTER TABLE "countries" DROP COLUMN "created_at";
ALTER TABLE "categories" DROP COLUMN "created_at";
ALTER TABLE "carts" DROP COLUMN "created_at";

ALTER TABLE "products" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT;

ALTER TABLE "products" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "cart_items" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "addresses" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "created_at" DROP DEFAULT;
