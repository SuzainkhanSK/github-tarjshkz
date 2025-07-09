/*
  # Admin System Tables

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `role` (text, enum: super_admin, moderator, support)
      - `permissions` (jsonb)
      - `is_active` (boolean, default true)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `created_by` (uuid, references admin_users.id)

    - `admin_activity_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, references admin_users.id)
      - `action` (text)
      - `target_type` (text)
      - `target_id` (uuid)
      - `details` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamp)

    - `system_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `description` (text)
      - `updated_by` (uuid, references admin_users.id)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all admin tables
    - Add policies for admin access only
    - Add audit logging functions

  3. Functions
    - Admin authentication functions
    - Activity logging functions
    - System settings management
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id)
);

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- RLS Policies for admin_users
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can read activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

-- RLS Policies for system_settings
CREATE POLICY "Admins can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Super admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
    )
  );

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  action_param text,
  target_type_param text DEFAULT NULL,
  target_id_param uuid DEFAULT NULL,
  details_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_activity_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    action_param,
    target_type_param,
    target_id_param,
    details_param
  );
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = user_id_param AND is_active = true
  );
END;
$$;

-- Function to get admin permissions
CREATE OR REPLACE FUNCTION get_admin_permissions(user_id_param uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_users%ROWTYPE;
BEGIN
  SELECT * INTO admin_record 
  FROM admin_users 
  WHERE id = user_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Return all permissions for super_admin
  IF admin_record.role = 'super_admin' THEN
    RETURN '["*"]'::jsonb;
  END IF;
  
  RETURN admin_record.permissions;
END;
$$;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', '"Premium Access Zone"', 'Website name'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('max_daily_spins', '3', 'Maximum daily spins per user'),
  ('max_daily_scratches', '3', 'Maximum daily scratches per user'),
  ('signup_bonus_points', '100', 'Points awarded on signup'),
  ('min_redemption_points', '500', 'Minimum points required for redemption')
ON CONFLICT (key) DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_admin_activity(text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_permissions(uuid) TO authenticated;