/*
  # Fix Subscription Management Persistence

  1. New Functions
    - `toggle_subscription_availability` - Security definer function to toggle subscription availability
    - `get_all_subscriptions` - Security definer function to get all subscriptions

  2. Security
    - Drop existing RLS policies on subscription_availability
    - Create new RLS policies that use auth.uid() directly
    - Enable RLS on subscription_availability table
*/

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND is_active = true
  );
END;
$$;

-- Create a function to toggle subscription availability
CREATE OR REPLACE FUNCTION public.toggle_subscription_availability(
  subscription_id_param uuid,
  new_status_param boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success boolean;
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can toggle subscription availability';
  END IF;

  -- Update the subscription availability
  UPDATE subscription_availability
  SET 
    in_stock = new_status_param,
    updated_at = now()
  WHERE id = subscription_id_param;

  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$;

-- Create a function to get all subscriptions
CREATE OR REPLACE FUNCTION public.get_all_subscriptions()
RETURNS SETOF subscription_availability
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can view all subscriptions';
  END IF;

  RETURN QUERY
  SELECT * FROM subscription_availability
  ORDER BY subscription_id, duration;
END;
$$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admin users can manage subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "All users can read subscription availability" ON subscription_availability;

-- Create new RLS policies
CREATE POLICY "Admin users can manage subscription availability"
ON subscription_availability
FOR ALL
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "All users can read subscription availability"
ON subscription_availability
FOR SELECT
TO anon, authenticated
USING (true);

-- Make sure RLS is enabled
ALTER TABLE subscription_availability ENABLE ROW LEVEL SECURITY;