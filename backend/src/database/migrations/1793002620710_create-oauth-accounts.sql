-- Up Migration
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

CREATE TABLE "oauth_accounts" (
    "id" uuid PRIMARY KEY,
    "user_id" uuid NOT NULL,
    "provider" varchar(50) NOT NULL,
    "provider_user_id" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "oauth_accounts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX ON "oauth_accounts" ("provider", "provider_user_id");
CREATE INDEX ON "oauth_accounts" ("user_id");
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "oauth_accounts" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration
DROP TABLE "oauth_accounts";
ALTER TABLE "users" ALTER COLUMN "phone_number" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;