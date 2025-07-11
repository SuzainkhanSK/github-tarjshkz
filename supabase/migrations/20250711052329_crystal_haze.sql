/*
  # Fix Infinite Recursion in Subscription Availability RLS

  1. Problem
    - RLS policies on subscription_availability table are causing infinite recursion
    - The policies reference admin_users table which has its own RLS policies
    - This creates a circular dependency causing the recursion error

  2. Solution
    - Drop existing problematic RLS policies
    - Create new simplified policies that use service role bypass
    - Use a security definer function to check admin status safely
    - Avoid circular references between tables

  3. Security
    - Maintain proper access control for admin operations
    - Use function-based approach to prevent recursion
    - Ensure only authenticated admin users can modify subscription availability
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admins can update subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admins can delete subscription availability" ON subscription_availability;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a simple existence check without triggering RLS
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = user_id 
    AND is_active = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;

-- Create new simplified RLS policies using the security definer function
CREATE POLICY "Admin users can insert subscription availability"
  ON subscription_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin users can update subscription availability"
  ON subscription_availability
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin users can delete subscription availability"
  ON subscription_availability
  FOR DELETE
  TO authenticated
  USING (is_admin_user(auth.uid()));

-- Ensure the existing SELECT policies remain intact for public access
-- (These should already exist and work fine)

-- Add comment for documentation
COMMENT ON FUNCTION is_admin_user(uuid) IS 'Security definer function to check admin status without RLS recursion';