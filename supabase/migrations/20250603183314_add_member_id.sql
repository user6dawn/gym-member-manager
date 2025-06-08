-- Add the member_id column
ALTER TABLE users ADD COLUMN member_id INTEGER UNIQUE;

-- Create a sequence for member_id that starts at 1 and can go up to 99999
CREATE SEQUENCE IF NOT EXISTS member_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 99999
    CACHE 1;

-- Create a function to format member_id with leading zeros
CREATE OR REPLACE FUNCTION format_member_id(id INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(id::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically assign the next member_id
CREATE OR REPLACE FUNCTION assign_member_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the next value from the sequence
    NEW.member_id := nextval('member_id_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically assign member_id on insert
CREATE TRIGGER assign_member_id_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_member_id();

-- Update existing users with sequential member_ids
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users ORDER BY created_at ASC LOOP
        UPDATE users 
        SET member_id = nextval('member_id_seq')
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 