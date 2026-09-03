BEGIN;

ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN,
    ADD COLUMN IF NOT EXISTS verification_token_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Preserve access for accounts created before email verification existed.
UPDATE "User" SET email_verified = TRUE WHERE email_verified IS NULL;
ALTER TABLE "User" ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN email_verified SET DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_verification_token
    ON "User" (verification_token_hash)
    WHERE verification_token_hash IS NOT NULL;

ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);

COMMIT;
