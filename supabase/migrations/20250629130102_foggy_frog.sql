-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can read own admin data" ON admin_users;

-- Drop existing functions first to avoid parameter name change errors
DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Create a function to check if user is a super admin without recursion
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is an admin without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies without circular references
-- Policy for users to read their own admin data
CREATE POLICY "Users can read own admin data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy for super admins to manage admin users
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Fix payment_transactions policies
DROP POLICY IF EXISTS "Admins can read all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can update payment transactions" ON payment_transactions;

-- Recreate payment_transactions policies using the function
CREATE POLICY "Admins can read all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix admin_activity_logs policies
DROP POLICY IF EXISTS "Admins can read activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON admin_activity_logs;

CREATE POLICY "Admins can read activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Fix system_settings policies
DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;

CREATE POLICY "Admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;