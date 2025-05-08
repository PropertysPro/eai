-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- IMPORTANT: SECURITY DEFINER and search_path
AS $$
BEGIN
  RAISE NOTICE 'handle_new_user function started';
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name', -- Assumes 'name' is passed in signUp options.data
    NEW.raw_user_meta_data->>'role'  -- Assumes 'role' is passed in signUp options.data, defaults to 'user' if not
  )
  ON CONFLICT (id) DO NOTHING; -- In case the profile somehow already exists for this id, do nothing.
  RAISE NOTICE 'handle_new_user function completed';
  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Drop if it exists from a previous attempt

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile entry for a new user from auth.users.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'When a new user signs up, create a corresponding record in public.profiles.';

-- Note:
-- 1. Ensure the 'profiles' table exists in the 'public' schema with columns: id (UUID, FK to auth.users.id), email (TEXT), name (TEXT), role (TEXT).
-- 2. The 'name' and 'role' fields are expected to be passed in the `options.data` object during `supabase.auth.signUp()`.
--    If 'role' is not passed, the 'profiles' table should have a default value for the 'role' column (e.g., DEFAULT 'user').
--    Your schema.sql indicates `role TEXT DEFAULT 'user'`, which is good.
-- 3. This script should be run by a user with sufficient privileges (e.g., postgres or a superuser).
