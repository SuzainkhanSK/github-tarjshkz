/*
  # Fix Signup Bonus System

  1. Updates
    - Fix constraint dropping order
    - Recreate handle_new_user function with better logic
    - Add manual bonus award functions
    - Create proper triggers for signup bonus

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user authentication checks
*/

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Drop the constraint (which will also drop the index)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS unique_signup_bonus;

-- Recreate the handle_new_user function with better logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_exists boolean;
  signup_bonus_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO user_profile_exists;
  
  -- Check if signup bonus already exists
  SELECT EXISTS(
    SELECT 1 FROM public.transactions 
    WHERE user_id = NEW.id AND task_type = 'signup'
  ) INTO signup_bonus_exists;
  
  -- Create profile if it doesn't exist
  IF NOT user_profile_exists THEN
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
    );
  ELSE
    -- Update existing profile with bonus if not already awarded
    IF NOT signup_bonus_exists THEN
      UPDATE public.profiles 
      SET 
        points = points + 100,
        total_earned = total_earned + 100
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  -- Add welcome bonus transaction if it doesn't exist
  IF NOT signup_bonus_exists THEN
    INSERT INTO public.transactions (user_id, type, points, description, task_type)
    VALUES (
      NEW.id,
      'earn',
      100,
      'Welcome Bonus - Account Confirmed',
      'signup'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new confirmed users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for when email gets confirmed later
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Improved function to manually award signup bonus
CREATE OR REPLACE FUNCTION public.award_missing_signup_bonus(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  user_exists boolean;
  profile_exists boolean;
  bonus_exists boolean;
  user_email text;
  user_name text;
BEGIN
  -- Check if user exists and is confirmed
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_param AND email_confirmed_at IS NOT NULL),
    email,
    COALESCE(raw_user_meta_data->>'full_name', '')
  INTO user_exists, user_email, user_name
  FROM auth.users 
  WHERE id = user_id_param;
  
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
  ) INTO bonus_exists;
  
  -- Create or update profile
  IF NOT profile_exists THEN
    INSERT INTO profiles (id, email, full_name, points, total_earned)
    VALUES (user_id_param, user_email, user_name, 100, 100);
  ELSE
    -- Only update if bonus doesn't exist
    IF NOT bonus_exists THEN
      UPDATE profiles 
      SET 
        points = points + 100,
        total_earned = total_earned + 100
      WHERE id = user_id_param;
    END IF;
  END IF;
  
  -- Award signup bonus if it doesn't exist
  IF NOT bonus_exists THEN
    INSERT INTO transactions (user_id, type, points, description, task_type)
    VALUES (user_id_param, 'earn', 100, 'Welcome Bonus - Account Confirmed', 'signup');
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix existing users who might be missing their bonus
CREATE OR REPLACE FUNCTION public.fix_all_missing_signup_bonuses()
RETURNS integer AS $$
DECLARE
  fixed_count integer := 0;
  user_record record;
BEGIN
  -- Find all confirmed users without signup bonus
  FOR user_record IN 
    SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
    FROM auth.users u
    LEFT JOIN transactions t ON (u.id = t.user_id AND t.task_type = 'signup')
    WHERE u.email_confirmed_at IS NOT NULL 
    AND t.id IS NULL
  LOOP
    -- Award the missing bonus
    IF award_missing_signup_bonus(user_record.id) THEN
      fixed_count := fixed_count + 1;
    END IF;
  END LOOP;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a safer unique constraint that allows for retries
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_signup_bonus 
ON transactions(user_id) 
WHERE task_type = 'signup';