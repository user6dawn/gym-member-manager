-- First, drop the trigger to prevent automatic assignment during our reset
DROP TRIGGER IF EXISTS assign_member_id_trigger ON users;

-- Reset all member_ids to null
UPDATE users SET member_id = NULL;

-- Drop and recreate the sequence to start fresh
DROP SEQUENCE IF EXISTS member_id_seq;
CREATE SEQUENCE member_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 99999
    CACHE 1;

-- Reassign member_ids based on creation date
WITH numbered_users AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_member_id
    FROM users
)
UPDATE users
SET member_id = numbered_users.new_member_id
FROM numbered_users
WHERE users.id = numbered_users.id;

-- Recreate the trigger for future inserts
CREATE OR REPLACE FUNCTION assign_member_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the next value from the sequence
    NEW.member_id := nextval('member_id_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_member_id_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_member_id();

-- Set the sequence to the next available number
SELECT setval('member_id_seq', (SELECT COALESCE(MAX(member_id), 0) FROM users), true); 