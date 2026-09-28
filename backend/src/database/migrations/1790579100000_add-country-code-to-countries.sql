-- Up Migration
ALTER TABLE "countries" ADD COLUMN "country_code" varchar NOT NULL UNIQUE;

-- Down Migration
ALTER TABLE "countries" DROP COLUMN "country_code";
