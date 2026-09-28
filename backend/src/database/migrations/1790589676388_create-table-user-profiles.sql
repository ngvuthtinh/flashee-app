-- Up Migration
CREATE TABLE "user_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE NOT NULL,
  "full_name" varchar,
  "date_of_birth" date,
  "avatar_url" text,
  "bio" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "user_profiles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TRIGGER IF EXISTS trigger_set_updated_at ON "user_profiles";
DROP TABLE "user_profiles";