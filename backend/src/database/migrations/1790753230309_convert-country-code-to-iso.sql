-- Up Migration
UPDATE "countries" SET "country_code" = 'VN' WHERE "country_code" = '+84';
UPDATE "countries" SET "country_code" = 'US' WHERE "country_code" = '+1';
ALTER TABLE "countries" ALTER COLUMN "country_code" TYPE varchar(2);

-- Down Migration
ALTER TABLE "countries" ALTER COLUMN "country_code" TYPE varchar;
UPDATE "countries" SET "country_code" = '+84' WHERE "country_code" = 'VN';
UPDATE "countries" SET "country_code" = '+1' WHERE "country_code" = 'US';
