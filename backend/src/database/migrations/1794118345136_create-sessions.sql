-- Up Migration
CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "user_agent" varchar(255),
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
CREATE INDEX ON "sessions" ("user_id");
CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON "sessions" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- existing refresh tokens have no session yet (only acceptable in a dev database)
DELETE FROM "refresh_tokens";
ALTER TABLE "refresh_tokens" ADD COLUMN "session_id" uuid NOT NULL;
ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE CASCADE;
CREATE INDEX ON "refresh_tokens" ("session_id");

-- Down Migration
-- dropping the column also drops its foreign key and index
ALTER TABLE "refresh_tokens" DROP COLUMN "session_id";
DROP TABLE "sessions";