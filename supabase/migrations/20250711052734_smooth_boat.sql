/*
  # Fix Subscription Management System

  1. New Functions
    - `is_admin_user(uuid)` - Security definer function to check if a user is an admin
    
  2. Security
    - Drop existing RLS policies on subscription_availability
    - Create new RLS policies using the security definer function
    - Enable RLS on subscription_availability
    
  3. Changes
    - Fix infinite recursion issue in RLS policies
    - Ensure admin users can manage subscriptions
*/

-- Create a security definer function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the user exists in admin_users table
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Drop existing policies on subscription_availability
DROP POLICY IF EXISTS "Admin users can delete subscription availability" ON public.subscription_availability;
DROP POLICY IF EXISTS "Admin users can insert subscription availability" ON public.subscription_availability;
DROP POLICY IF EXISTS "Admin users can update subscription availability" ON public.subscription_availability;
DROP POLICY IF EXISTS "All authenticated users can read subscription availability" ON public.subscription_availability;
DROP POLICY IF EXISTS "Anonymous users can read subscription availability" ON public.subscription_availability;

-- Create new policies using the security definer function
CREATE POLICY "Admin users can manage subscription availability"
ON public.subscription_availability
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "All users can read subscription availability"
ON public.subscription_availability
FOR SELECT
USING (true);

-- Make sure RLS is enabled
ALTER TABLE public.subscription_availability ENABLE ROW LEVEL SECURITY;

-- Create a function to get all subscriptions (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_subscriptions()
RETURNS SETOF public.subscription_availability
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.subscription_availability
  ORDER BY subscription_id, duration;
$$;