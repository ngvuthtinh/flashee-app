CREATE TABLE "users" (
  "user_id" uuid PRIMARY KEY,
  "user_name" varchar NOT NULL,
  "email_address" varchar UNIQUE NOT NULL,
  "phone_number" varchar(20) NOT NULL,
  "password" varchar NOT NULL,
  "role" varchar NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "countries" (
  "country_id" uuid PRIMARY KEY,
  "country_name" varchar
);

CREATE TABLE "addresses" (
  "address_id" uuid PRIMARY KEY,
  "name" varchar,
  "street" varchar,
  "ward" varchar,
  "district" varchar,
  "city" varchar,
  "longitude" decimal(9,6),
  "latitude" decimal(9,6),
  "created_at" timestamp,
  "country_id" uuid NOT NULL
);

CREATE TABLE "user_address" (
  "user_address_id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "address_id" uuid NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false
);

CREATE TABLE "products" (
  "product_id" uuid PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" varchar,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "product_images" (
  "product_image_id" uuid PRIMARY KEY,
  "product_id" uuid NOT NULL,
  "image_url" text,
  "is_thumbnail" boolean
);

CREATE TABLE "categories" (
  "category_id" uuid PRIMARY KEY,
  "name" varchar,
  "description" varchar
);

CREATE TABLE "product_category" (
  "product_category_id" uuid PRIMARY KEY,
  "product_id" uuid NOT NULL,
  "category_id" uuid NOT NULL
);

CREATE TABLE "product_variants" (
  "product_variant_id" uuid PRIMARY KEY,
  "product_id" uuid NOT NULL,
  "sku" varchar UNIQUE NOT NULL,
  "price" decimal(12,2) NOT NULL,
  "stock_quantity" int NOT NULL DEFAULT 0,
  "color" varchar,
  "size" varchar
);

CREATE TABLE "orders" (
  "order_id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "order_code" varchar UNIQUE,
  "status" varchar NOT NULL DEFAULT 'PENDING',
  "payment_status" varchar NOT NULL DEFAULT 'UNPAID',
  "subtotal_amount" decimal(12,2) NOT NULL,
  "shipping_fee" decimal(12,2) NOT NULL DEFAULT 0,
  "discount_amount" decimal(12,2) NOT NULL DEFAULT 0,
  "total_amount" decimal(12,2) NOT NULL,
  "shipping_address" text NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "carts" (
  "cart_id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE NOT NULL,
  "updated_at" timestamp DEFAULT 'now()'
);

CREATE TABLE "cart_items" (
  "cart_item_id" uuid PRIMARY KEY,
  "product_variant_id" uuid NOT NULL,
  "cart_id" uuid NOT NULL,
  "quantity" int NOT NULL DEFAULT 1,
  "created_at" timestamp
);

CREATE TABLE "order_items" (
  "order_item_id" uuid PRIMARY KEY,
  "order_id" uuid NOT NULL,
  "product_variant_id" uuid NOT NULL,
  "quantity" int NOT NULL,
  "unit_price" decimal(12,2) NOT NULL,
  "subtotal" decimal(12,2) NOT NULL
);

CREATE TABLE "payments" (
  "payment_id" uuid PRIMARY KEY,
  "order_id" uuid NOT NULL,
  "payment_method" varchar NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "status" varchar NOT NULL DEFAULT 'PENDING',
  "transaction_id" varchar,
  "created_at" timestamp NOT NULL DEFAULT 'now()'
);

CREATE TABLE "reviews" (
  "review_id" uuid PRIMARY KEY,
  "comment" text,
  "rating" int NOT NULL,
  "order_item_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE INDEX ON "product_variants" ("product_id");

CREATE INDEX ON "product_variants" ("product_id", "price");

CREATE INDEX ON "orders" ("user_id");

CREATE INDEX ON "orders" ("user_id", "created_at");

CREATE INDEX ON "orders" ("status");

CREATE UNIQUE INDEX ON "cart_items" ("cart_id", "product_variant_id");

CREATE INDEX ON "order_items" ("order_id");

CREATE INDEX ON "order_items" ("product_variant_id");

CREATE INDEX ON "reviews" ("product_id");

CREATE INDEX ON "reviews" ("product_id", "rating");

ALTER TABLE "addresses" ADD FOREIGN KEY ("country_id") REFERENCES "countries" ("country_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_address" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_address" ADD FOREIGN KEY ("address_id") REFERENCES "addresses" ("address_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_images" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_category" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_category" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("category_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_variants" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "carts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cart_items" ADD FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("product_variant_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("cart_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("order_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("product_variant_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("order_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("order_item_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;
