-- Up Migration
ALTER TABLE "users" ADD CONSTRAINT users_email_lowercase_check CHECK (email_address = lower(email_address));
DELETE FROM users WHERE email_address LIKE 'race-%' OR email_address LIKE 'probe-%';

-- Down Migration
ALTER TABLE "users" DROP CONSTRAINT users_email_lowercase_check;
