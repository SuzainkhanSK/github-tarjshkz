/*
  # Rewards Redemption System Tables

  1. New Tables
    - `redemption_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `subscription_id` (text)
      - `subscription_name` (text)
      - `duration` (text)
      - `points_cost` (integer)
      - `status` (text)
      - `activation_code` (text, optional)
      - `instructions` (text, optional)
      - `expires_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)

    - `gift_subscriptions`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `recipient_email` (text)
      - `subscription_id` (text)
      - `duration` (text)
      - `points_cost` (integer)
      - `message` (text, optional)
      - `status` (text)
      - `claimed_at` (timestamp, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Process redemption requests
    - Handle gift subscriptions
    - Check redemption limits
*/

-- Create redemption_requests table
CREATE TABLE IF NOT EXISTS redemption_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  subscription_name text NOT NULL,
  duration text NOT NULL,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  activation_code text,
  instructions text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create gift_subscriptions table
CREATE TABLE IF NOT EXISTS gift_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subscription_id text NOT NULL,
  subscription_name text NOT NULL,
  duration text NOT NULL,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'expired')),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redemption_requests_user_id ON redemption_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_created_at ON redemption_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_sender_id ON gift_subscriptions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient_email ON gift_subscriptions(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON gift_subscriptions(status);

-- RLS Policies for redemption_requests
CREATE POLICY "Users can read own redemption requests"
  ON redemption_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemption requests"
  ON redemption_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redemption requests"
  ON redemption_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for gift_subscriptions
CREATE POLICY "Users can read own gift subscriptions"
  ON gift_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can insert own gift subscriptions"
  ON gift_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Function to check daily redemption limits
CREATE OR REPLACE FUNCTION check_daily_redemption_limit(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  redemptions_today integer;
  daily_limit integer := 3;
BEGIN
  -- Count redemptions today
  SELECT COUNT(*)
  INTO redemptions_today
  FROM redemption_requests
  WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day'
    AND status != 'cancelled';

  RETURN daily_limit - redemptions_today;
END;
$$;

-- Function to process redemption request
CREATE OR REPLACE FUNCTION process_redemption_request(
  user_id_param uuid,
  subscription_id_param text,
  subscription_name_param text,
  duration_param text,
  points_cost_param integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  redemptions_remaining integer;
  current_points integer;
  request_id uuid;
BEGIN
  -- Check if user is authenticated and is the same user
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only process your own redemptions';
  END IF;

  -- Check daily redemption limit
  SELECT check_daily_redemption_limit(user_id_param) INTO redemptions_remaining;
  
  IF redemptions_remaining <= 0 THEN
    RAISE EXCEPTION 'Daily redemption limit exceeded';
  END IF;

  -- Check user has enough points
  SELECT points INTO current_points FROM profiles WHERE id = user_id_param;
  
  IF current_points < points_cost_param THEN
    RAISE EXCEPTION 'Insufficient points for this redemption';
  END IF;

  -- Create redemption request
  INSERT INTO redemption_requests (
    user_id, 
    subscription_id, 
    subscription_name, 
    duration, 
    points_cost,
    status
  )
  VALUES (
    user_id_param, 
    subscription_id_param, 
    subscription_name_param, 
    duration_param, 
    points_cost_param,
    'pending'
  )
  RETURNING id INTO request_id;

  -- Deduct points and create transaction
  INSERT INTO transactions (user_id, type, points, description, task_type)
  VALUES (
    user_id_param, 
    'redeem', 
    points_cost_param, 
    'Redeemed: ' || subscription_name_param || ' (' || duration_param || ')',
    'redemption'
  );

  -- Update user profile
  UPDATE profiles
  SET points = points - points_cost_param
  WHERE id = user_id_param;

  RETURN request_id;
END;
$$;

-- Function to send gift subscription
CREATE OR REPLACE FUNCTION send_gift_subscription(
  sender_id_param uuid,
  recipient_email_param text,
  subscription_id_param text,
  subscription_name_param text,
  duration_param text,
  points_cost_param integer,
  message_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points integer;
  gift_id uuid;
BEGIN
  -- Check if user is authenticated and is the same user
  IF auth.uid() != sender_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only send gifts from your own account';
  END IF;

  -- Check user has enough points
  SELECT points INTO current_points FROM profiles WHERE id = sender_id_param;
  
  IF current_points < points_cost_param THEN
    RAISE EXCEPTION 'Insufficient points for this gift';
  END IF;

  -- Create gift subscription
  INSERT INTO gift_subscriptions (
    sender_id,
    recipient_email,
    subscription_id,
    subscription_name,
    duration,
    points_cost,
    message,
    status
  )
  VALUES (
    sender_id_param,
    recipient_email_param,
    subscription_id_param,
    subscription_name_param,
    duration_param,
    points_cost_param,
    message_param,
    'pending'
  )
  RETURNING id INTO gift_id;

  -- Deduct points and create transaction
  INSERT INTO transactions (user_id, type, points, description, task_type)
  VALUES (
    sender_id_param,
    'redeem',
    points_cost_param,
    'Gift: ' || subscription_name_param || ' (' || duration_param || ') to ' || recipient_email_param,
    'gift'
  );

  -- Update user profile
  UPDATE profiles
  SET points = points - points_cost_param
  WHERE id = sender_id_param;

  RETURN gift_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_daily_redemption_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_redemption_request(uuid, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION send_gift_subscription(uuid, text, text, text, text, integer, text) TO authenticated;