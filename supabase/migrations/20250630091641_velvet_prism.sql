-- Create subscription_availability table
CREATE TABLE IF NOT EXISTS subscription_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id text NOT NULL,
  duration text NOT NULL,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subscription_id, duration)
);

-- Enable RLS
ALTER TABLE subscription_availability ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_availability_subscription_id ON subscription_availability(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_availability_in_stock ON subscription_availability(in_stock);

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS update_subscription_availability_updated_at ON subscription_availability;

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_availability_updated_at
  BEFORE UPDATE ON subscription_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing email function if it exists
DROP FUNCTION IF EXISTS email();

-- Helper function to get user email - CREATING THIS BEFORE USING IT IN POLICIES
CREATE OR REPLACE FUNCTION email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT LOWER(email)
  FROM auth.users
  WHERE id = auth.uid()
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anonymous users can read subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "All authenticated users can read subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admin users can insert subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admin users can update subscription availability" ON subscription_availability;
DROP POLICY IF EXISTS "Admin users can delete subscription availability" ON subscription_availability;

-- RLS Policies for subscription_availability
-- Allow anonymous and authenticated users to read availability
CREATE POLICY "Anonymous users can read subscription availability"
  ON subscription_availability
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "All authenticated users can read subscription availability"
  ON subscription_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin policies for managing availability
-- Using email-based admin check for simplicity
CREATE POLICY "Admin users can insert subscription availability"
  ON subscription_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (email() = ANY (ARRAY['suzainkhan8360@gmail.com', 'admin@premiumaccesszone.com', 'support@premiumaccesszone.com', 'moderator@premiumaccesszone.com']));

CREATE POLICY "Admin users can update subscription availability"
  ON subscription_availability
  FOR UPDATE
  TO authenticated
  USING (email() = ANY (ARRAY['suzainkhan8360@gmail.com', 'admin@premiumaccesszone.com', 'support@premiumaccesszone.com', 'moderator@premiumaccesszone.com']))
  WITH CHECK (email() = ANY (ARRAY['suzainkhan8360@gmail.com', 'admin@premiumaccesszone.com', 'support@premiumaccesszone.com', 'moderator@premiumaccesszone.com']));

CREATE POLICY "Admin users can delete subscription availability"
  ON subscription_availability
  FOR DELETE
  TO authenticated
  USING (email() = ANY (ARRAY['suzainkhan8360@gmail.com', 'admin@premiumaccesszone.com', 'support@premiumaccesszone.com', 'moderator@premiumaccesszone.com']));

-- Insert initial data for common subscriptions
INSERT INTO subscription_availability (subscription_id, duration, in_stock)
VALUES
  -- YouTube Premium
  ('youtube_premium', '1 Month', true),
  ('youtube_premium', '2 Months', true),
  ('youtube_premium', '3 Months', true),
  ('youtube_premium', '6 Months', true),
  ('youtube_premium', '1 Year', true),
  
  -- Netflix
  ('netflix', '1 Month', true),
  ('netflix', '2 Months', true),
  ('netflix', '3 Months', true),
  ('netflix', '6 Months', true),
  ('netflix', '1 Year', true),
  
  -- Amazon Prime
  ('amazon_prime', '1 Month', true),
  ('amazon_prime', '3 Months', true),
  ('amazon_prime', '6 Months', true),
  ('amazon_prime', '1 Year', true),
  
  -- Spotify Premium
  ('spotify_premium', '1 Month', true),
  ('spotify_premium', '2 Months', true),
  ('spotify_premium', '3 Months', true),
  ('spotify_premium', '6 Months', true),
  ('spotify_premium', '1 Year', true),
  
  -- Disney+ Hotstar
  ('disney_hotstar', '1 Month', true),
  ('disney_hotstar', '3 Months', true),
  ('disney_hotstar', '6 Months', true),
  ('disney_hotstar', '1 Year', true),
  
  -- JioSaavn Pro
  ('jiosaavn_pro', '1 Month', true),
  ('jiosaavn_pro', '3 Months', true),
  ('jiosaavn_pro', '6 Months', true),
  ('jiosaavn_pro', '1 Year', true)
ON CONFLICT (subscription_id, duration) DO NOTHING;