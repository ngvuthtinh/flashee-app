-- Up Migration
DELETE FROM "sessions";
ALTER TABLE "sessions"
  ADD COLUMN "token_hash" varchar NOT NULL UNIQUE,
  ADD COLUMN "previous_token_hash" varchar,
  ADD COLUMN "token_issued_at" timestamp NOT NULL,
  ADD COLUMN "expires_at" timestamp NOT NULL;
CREATE INDEX ON "sessions" ("previous_token_hash");
DROP TABLE "refresh_tokens";

-- Down Migration
CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "token_hash" varchar UNIQUE NOT NULL,
  "user_agent" varchar(255),
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE CASCADE;
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "refresh_tokens" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX ON "refresh_tokens" ("user_id");
CREATE INDEX ON "refresh_tokens" ("session_id");
DELETE FROM "sessions";
ALTER TABLE "sessions"
  DROP COLUMN "expires_at",
  DROP COLUMN "token_issued_at",
  DROP COLUMN "previous_token_hash",
  DROP COLUMN "token_hash";