-- Up Migration
CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "token_hash" varchar UNIQUE NOT NULL,
  "user_agent" varchar(255),
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "refresh_tokens" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX ON "refresh_tokens" ("user_id");

-- Down Migration
DROP TABLE "refresh_tokens";
