-- Up Migration
ALTER TABLE "products" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "product_variants" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "product_variants" ADD CONSTRAINT product_variants_price_check CHECK (price >= 0);
ALTER TABLE "product_variants" ADD CONSTRAINT product_variants_stock_check CHECK (stock_quantity >= 0);
ALTER TABLE "product_variants" ADD CONSTRAINT product_variants_product_color_size_key UNIQUE NULLS NOT DISTINCT (product_id, color, size);
-- Down Migration
ALTER TABLE "product_variants" DROP CONSTRAINT product_variants_product_color_size_key;
ALTER TABLE "product_variants" DROP CONSTRAINT product_variants_stock_check;
ALTER TABLE "product_variants" DROP CONSTRAINT product_variants_price_check;
ALTER TABLE "product_variants" DROP COLUMN "is_active";
ALTER TABLE "products" DROP COLUMN "is_active";
