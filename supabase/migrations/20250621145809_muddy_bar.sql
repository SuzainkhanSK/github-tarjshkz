/*
  # Spin & Win Game Tables

  1. New Tables
    - `spin_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `prize_label` (text)
      - `points_won` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `spin_history` table
    - Add policies for users to read/write their own spin history

  3. Functions
    - Function to check daily spin limits
    - Function to award spin prizes
*/

-- Create spin_history table
CREATE TABLE IF NOT EXISTS spin_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prize_label text NOT NULL,
  points_won integer NOT NULL CHECK (points_won > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id ON spin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_created_at ON spin_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spin_history_points_won ON spin_history(points_won DESC);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_date ON spin_history(user_id, created_at DESC);

-- RLS Policies
CREATE POLICY "Users can read own spin history"
  ON spin_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spin history"
  ON spin_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to check daily spin limit
CREATE OR REPLACE FUNCTION check_daily_spin_limit(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  spins_today integer;
  daily_limit integer := 3;
BEGIN
  -- Check if user is authenticated and is the same user
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only check your own spin limit';
  END IF;

  -- Count spins today
  SELECT COUNT(*)
  INTO spins_today
  FROM spin_history
  WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';

  RETURN daily_limit - spins_today;
END;
$$;

-- Function to process spin win
CREATE OR REPLACE FUNCTION process_spin_win(
  user_id_param uuid,
  prize_label_param text,
  points_won_param integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  spins_remaining integer;
  current_points integer;
  current_total_earned integer;
BEGIN
  -- Check if user is authenticated and is the same user
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only process your own spins';
  END IF;

  -- Check daily spin limit
  SELECT check_daily_spin_limit(user_id_param) INTO spins_remaining;
  
  IF spins_remaining <= 0 THEN
    RAISE EXCEPTION 'Daily spin limit exceeded';
  END IF;

  -- Get current user points
  SELECT points, total_earned
  INTO current_points, current_total_earned
  FROM profiles
  WHERE id = user_id_param;

  -- Insert spin history
  INSERT INTO spin_history (user_id, prize_label, points_won)
  VALUES (user_id_param, prize_label_param, points_won_param);

  -- Insert transaction
  INSERT INTO transactions (user_id, type, points, description, task_type)
  VALUES (user_id_param, 'earn', points_won_param, 'Spin & Win: ' || prize_label_param, 'spin_win');

  -- Update user profile
  UPDATE profiles
  SET 
    points = current_points + points_won_param,
    total_earned = current_total_earned + points_won_param,
    updated_at = now()
  WHERE id = user_id_param;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process spin win: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_daily_spin_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_spin_win(uuid, text, integer) TO authenticated;