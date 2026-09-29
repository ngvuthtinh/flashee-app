-- Up Migration
CREATE UNIQUE INDEX ON "product_category" ("category_id", "product_id");
DROP INDEX "product_variants_product_id_idx";
DROP INDEX "reviews_product_id_idx";
DROP INDEX "orders_user_id_idx";

-- Down Migration
CREATE INDEX ON "product_variants" ("product_id");
CREATE INDEX ON "reviews" ("product_id");
CREATE INDEX ON "orders" ("user_id");

DROP INDEX "product_category_category_id_product_id_idx";