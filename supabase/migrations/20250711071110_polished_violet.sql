/*
  # Fix Redemption Management Policies

  1. Changes
     - Add policy to allow admins to update redemption requests
     - Add function to check if a user is an admin
     - Add policy for admins to read all redemption requests
*/

-- Create or replace the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  admin_emails text[] := ARRAY['suzainkhan8360@gmail.com', 'Suzainkhan8360@gmail.com', 'admin@premiumaccesszone.com', 'support@premiumaccesszone.com', 'moderator@premiumaccesszone.com'];
  user_email text;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if the user's email is in the admin list (case insensitive)
  RETURN user_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(admin_emails) admin_email
    WHERE lower(admin_email) = lower(user_email)
  );
END;
$$;

-- Add policy for admins to update any redemption request
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'redemption_requests' 
    AND policyname = 'Admins can update any redemption request'
  ) THEN
    CREATE POLICY "Admins can update any redemption request" 
    ON public.redemption_requests
    FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END
$$;

-- Add policy for admins to read all redemption requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'redemption_requests' 
    AND policyname = 'Admins can read all redemption requests'
  ) THEN
    CREATE POLICY "Admins can read all redemption requests" 
    ON public.redemption_requests
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));
  END IF;
END
$$;