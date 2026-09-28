-- Up Migration
ALTER TABLE "users" RENAME COLUMN "user_id" TO "id";
ALTER TABLE "countries" RENAME COLUMN "country_id" TO "id";
ALTER TABLE "addresses" RENAME COLUMN "address_id" TO "id";
ALTER TABLE "user_address" RENAME COLUMN "user_address_id" TO "id";
ALTER TABLE "products" RENAME COLUMN "product_id" TO "id";
ALTER TABLE "product_images" RENAME COLUMN "product_image_id" TO "id";
ALTER TABLE "categories" RENAME COLUMN "category_id" TO "id";
ALTER TABLE "product_category" RENAME COLUMN "product_category_id" TO "id";
ALTER TABLE "product_variants" RENAME COLUMN "product_variant_id" TO "id";
ALTER TABLE "orders" RENAME COLUMN "order_id" TO "id";
ALTER TABLE "carts" RENAME COLUMN "cart_id" TO "id";
ALTER TABLE "cart_items" RENAME COLUMN "cart_item_id" TO "id";
ALTER TABLE "order_items" RENAME COLUMN "order_item_id" TO "id";
ALTER TABLE "payments" RENAME COLUMN "payment_id" TO "id";
ALTER TABLE "reviews" RENAME COLUMN "review_id" TO "id";

-- Down Migration
ALTER TABLE "users" RENAME COLUMN "id" TO "user_id";
ALTER TABLE "countries" RENAME COLUMN "id" TO "country_id";
ALTER TABLE "addresses" RENAME COLUMN "id" TO "address_id";
ALTER TABLE "user_address" RENAME COLUMN "id" TO "user_address_id";
ALTER TABLE "products" RENAME COLUMN "id" TO "product_id";
ALTER TABLE "product_images" RENAME COLUMN "id" TO "product_image_id";
ALTER TABLE "categories" RENAME COLUMN "id" TO "category_id";
ALTER TABLE "product_category" RENAME COLUMN "id" TO "product_category_id";
ALTER TABLE "product_variants" RENAME COLUMN "id" TO "product_variant_id";
ALTER TABLE "orders" RENAME COLUMN "id" TO "order_id";
ALTER TABLE "carts" RENAME COLUMN "id" TO "cart_id";
ALTER TABLE "cart_items" RENAME COLUMN "id" TO "cart_item_id";
ALTER TABLE "order_items" RENAME COLUMN "id" TO "order_item_id";
ALTER TABLE "payments" RENAME COLUMN "id" TO "payment_id";
ALTER TABLE "reviews" RENAME COLUMN "id" TO "review_id";
