-- Up Migration
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "countries" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "addresses" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "user_address" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "product_images" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "product_category" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "product_variants" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "cart_items" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "order_items" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "countries" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "addresses" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "user_address" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "product_images" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "product_category" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "product_variants" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "cart_items" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "order_items" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "carts" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "reviews" FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Down Migration
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "users";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "countries";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "addresses";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "user_address";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "product_images";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "categories";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "product_category";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "product_variants";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "cart_items";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "order_items";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "payments";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "products";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "orders";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "carts";
DROP TRIGGER IF EXISTS trigger_set_updated_at ON "reviews";
DROP FUNCTION IF EXISTS set_updated_at();

ALTER TABLE "users" DROP COLUMN "updated_at";
ALTER TABLE "countries" DROP COLUMN "updated_at";
ALTER TABLE "addresses" DROP COLUMN "updated_at";
ALTER TABLE "user_address" DROP COLUMN "updated_at";
ALTER TABLE "product_images" DROP COLUMN "updated_at";
ALTER TABLE "categories" DROP COLUMN "updated_at";
ALTER TABLE "product_category" DROP COLUMN "updated_at";
ALTER TABLE "product_variants" DROP COLUMN "updated_at";
ALTER TABLE "cart_items" DROP COLUMN "updated_at";
ALTER TABLE "order_items" DROP COLUMN "updated_at";
ALTER TABLE "payments" DROP COLUMN "updated_at";

