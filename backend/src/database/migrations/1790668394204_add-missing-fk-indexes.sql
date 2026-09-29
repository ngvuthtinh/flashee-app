-- Up Migration
CREATE INDEX ON "payments" ("order_id");
CREATE INDEX ON "product_images" ("product_id");
CREATE INDEX ON "user_address" ("user_id");

-- Down Migration
DROP INDEX "payments_order_id_idx";
DROP INDEX "product_images_product_id_idx";
DROP INDEX "user_address_user_id_idx";
