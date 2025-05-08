-- Migration to fix wallet creation order: ensure wallet is created only after profile is created

-- 1. Drop the old trigger on auth.users (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'create_wallet_after_user_insert'
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        DROP TRIGGER create_wallet_after_user_insert ON auth.users;
    END IF;
END;
$$;

-- 2. Create a new trigger function for wallet creation after profile insert
CREATE OR REPLACE FUNCTION create_wallet_after_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create wallet if one does not already exist for this user
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = NEW.id) THEN
        INSERT INTO wallets (user_id) VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the new trigger on public.profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'create_wallet_after_profile_insert'
        AND tgrelid = 'profiles'::regclass
    ) THEN
        CREATE TRIGGER create_wallet_after_profile_insert
        AFTER INSERT ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION create_wallet_after_profile_insert();
    END IF;
END;
$$;

-- 4. (Optional) Comment for documentation
COMMENT ON FUNCTION create_wallet_after_profile_insert() IS 'Creates a wallet for a user after their profile is created.';
COMMENT ON TRIGGER create_wallet_after_profile_insert ON profiles IS 'Ensures wallet is created only after profile exists.';
