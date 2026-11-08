-- Up Migration
DROP TABLE revoked_tokens;

-- Down Migration
CREATE TABLE revoked_tokens (
    jti uuid PRIMARY KEY,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
