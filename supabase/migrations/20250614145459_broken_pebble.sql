/*
  # Fix Signup Bonus Implementation

  1. Updates
    - Ensure the handle_new_user function works correctly
    - Add better error handling
    - Make sure the trigger fires properly
    - Add a function to manually award signup bonus for existing users

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user authentication checks
*/

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with welcome bonus
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    points, 
    total_earned
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    100, -- Welcome bonus
    100  -- Welcome bonus counts toward total earned
  )
  ON CONFLICT (id) DO UPDATE SET
    points = GREATEST(profiles.points, 100),
    total_earned = GREATEST(profiles.total_earned, 100);
  
  -- Add welcome bonus transaction (only if it doesn't exist)
  INSERT INTO public.transactions (user_id, type, points, description, task_type)
  VALUES (
    NEW.id,
    'earn',
    100,
    'Welcome Bonus - Account Confirmed',
    'signup'
  )
  ON CONFLICT DO NOTHING; -- Prevent duplicate welcome bonuses
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for when email gets confirmed later
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Function to manually award signup bonus for existing users who might have missed it
CREATE OR REPLACE FUNCTION public.award_missing_signup_bonus(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  user_exists boolean;
  profile_exists boolean;
  bonus_exists boolean;
BEGIN
  -- Check if user exists and is confirmed
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN false;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id_param) INTO profile_exists;
  
  -- Check if signup bonus already exists
  SELECT EXISTS(
    SELECT 1 FROM transactions 
    WHERE user_id = user_id_param 
    AND task_type = 'signup'
    AND description LIKE '%Welcome Bonus%'
  ) INTO bonus_exists;
  
  -- Create profile if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO profiles (id, email, full_name, points, total_earned)
    SELECT 
      u.id, 
      u.email, 
      COALESCE(u.raw_user_meta_data->>'full_name', ''),
      100,
      100
    FROM auth.users u 
    WHERE u.id = user_id_param;
  END IF;
  
  -- Award signup bonus if it doesn't exist
  IF NOT bonus_exists THEN
    -- Add the transaction
    INSERT INTO transactions (user_id, type, points, description, task_type)
    VALUES (user_id_param, 'earn', 100, 'Welcome Bonus - Account Confirmed', 'signup');
    
    -- Update profile points
    UPDATE profiles 
    SET 
      points = points + 100,
      total_earned = total_earned + 100
    WHERE id = user_id_param;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to prevent duplicate signup bonuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_signup_bonus' 
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT unique_signup_bonus 
    UNIQUE (user_id, task_type) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    -- Constraint already exists, ignore
    NULL;
END $$;