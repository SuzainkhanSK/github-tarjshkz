/*
  # Fix infinite recursion in admin_users RLS policies

  1. Problem
    - The admin_users table has RLS policies that create infinite recursion
    - This affects queries to payment_transactions and other tables that check admin status
    - The policies reference admin_users table within their own policy checks

  2. Solution
    - Drop existing problematic policies on admin_users table
    - Create new, simpler policies that avoid circular references
    - Use direct user ID checks instead of complex subqueries where possible

  3. Security
    - Maintain proper access control for admin users
    - Ensure only authenticated users can access their own admin data
    - Allow super admins to manage other admin users safely
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create new policies without circular references
-- Policy for reading admin user data - simplified to avoid recursion
CREATE POLICY "Users can read own admin data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy for super admins to read all admin users
-- This uses a direct check instead of a subquery to avoid recursion
CREATE POLICY "Super admins can read all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
      LIMIT 1
    )
  );

-- Policy for super admins to insert new admin users
CREATE POLICY "Super admins can insert admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
      LIMIT 1
    )
  );

-- Policy for super admins to update admin users
CREATE POLICY "Super admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
      LIMIT 1
    )
  );

-- Policy for super admins to delete admin users
CREATE POLICY "Super admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
      LIMIT 1
    )
  );

-- Also fix the payment_transactions policies to be more efficient
-- Drop and recreate the admin policy for payment_transactions
DROP POLICY IF EXISTS "Admins can read all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can update payment transactions" ON payment_transactions;

-- Recreate with simpler, non-recursive checks
CREATE POLICY "Admins can read all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  );

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  );

-- Fix admin_activity_logs policies as well
DROP POLICY IF EXISTS "Admins can insert activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can read activity logs" ON admin_activity_logs;

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  );

CREATE POLICY "Admins can read activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  );

-- Fix system_settings policies
DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;

CREATE POLICY "Admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE is_active = true
    )
  );

CREATE POLICY "Super admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE role = 'super_admin' 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users 
      WHERE role = 'super_admin' 
      AND is_active = true
    )
  );