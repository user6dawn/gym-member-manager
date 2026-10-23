-- Add unique constraints for email and phone to prevent duplicate registrations
-- This migration ensures data integrity at the database level

-- Add unique constraint on email (case-insensitive)
-- First, remove any existing duplicates
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(email)) as row_num
    FROM users
    WHERE email IS NOT NULL
  ) t
  WHERE row_num > 1
);

-- Create unique index on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email))
WHERE email IS NOT NULL;

-- Add unique constraint on phone (normalized)
-- First, remove any existing duplicates
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY REGEXP_REPLACE(phone, '[^0-9]', '')) as row_num
    FROM users
    WHERE phone IS NOT NULL
  ) t
  WHERE row_num > 1
);

-- Create unique index on phone (normalized)
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (REGEXP_REPLACE(phone, '[^0-9]', ''))
WHERE phone IS NOT NULL;

-- Add comment to document the constraints
COMMENT ON INDEX users_email_unique_idx IS 'Ensures unique email addresses (case-insensitive)';
COMMENT ON INDEX users_phone_unique_idx IS 'Ensures unique phone numbers (normalized, digits only)';
