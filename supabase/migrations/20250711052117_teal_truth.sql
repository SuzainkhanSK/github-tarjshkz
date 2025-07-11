/*
  # Fix Subscription Availability RLS Policies

  1. Policy Updates
    - Remove dependency on auth.users table access
    - Use direct admin_users table check instead of email() function
    - Ensure admin users can manage subscription availability

  2. Security
    - Maintain proper access control for admin operations
    - Remove problematic email-based authentication that requires users table access
*/

-- Drop existing policies that cause permission issues
DROP POLICY IF EXISTS "Admin users can insert subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admin users can update subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admin users can delete subscription availability" ON subscription_availability;

-- Create new policies that don't require users table access
CREATE POLICY "Admins can insert subscription availability"
  ON subscription_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update subscription availability"
  ON subscription_availability
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete subscription availability"
  ON subscription_availability
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );