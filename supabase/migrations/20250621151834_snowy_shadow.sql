/*
  # Scratch & Earn Game Tables

  1. New Tables
    - `scratch_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `prize_label` (text)
      - `points_won` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `scratch_history` table
    - Add policies for authenticated users to read/insert their own data

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create scratch_history table
CREATE TABLE IF NOT EXISTS scratch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prize_label text NOT NULL,
  points_won integer NOT NULL CHECK (points_won > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scratch_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own scratch history"
  ON scratch_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scratch history"
  ON scratch_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scratch_history_user_id ON scratch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scratch_history_created_at ON scratch_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scratch_history_points_won ON scratch_history(points_won DESC);
CREATE INDEX IF NOT EXISTS idx_scratch_history_user_date ON scratch_history(user_id, created_at DESC);

-- Create function to check daily scratch limit
CREATE OR REPLACE FUNCTION check_daily_scratch_limit(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scratches_today integer;
BEGIN
  -- Count scratches for today
  SELECT COUNT(*)
  INTO scratches_today
  FROM scratch_history
  WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  -- Return remaining scratches (max 3 per day)
  RETURN GREATEST(0, 3 - scratches_today);
END;
$$;

-- Create function to process scratch win
CREATE OR REPLACE FUNCTION process_scratch_win(
  user_id_param uuid,
  prize_label_param text,
  points_won_param integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scratches_today integer;
  current_points integer;
  current_total_earned integer;
BEGIN
  -- Check if user has scratches remaining today
  SELECT check_daily_scratch_limit(user_id_param) INTO scratches_today;
  
  IF scratches_today <= 0 THEN
    RAISE EXCEPTION 'No scratches remaining today';
  END IF;
  
  -- Get current user points
  SELECT points, total_earned
  INTO current_points, current_total_earned
  FROM profiles
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Insert scratch history
  INSERT INTO scratch_history (user_id, prize_label, points_won)
  VALUES (user_id_param, prize_label_param, points_won_param);
  
  -- Insert transaction
  INSERT INTO transactions (user_id, type, points, description, task_type)
  VALUES (user_id_param, 'earn', points_won_param, 'Scratch & Earn: ' || prize_label_param, 'scratch_earn');
  
  -- Update user profile
  UPDATE profiles
  SET 
    points = current_points + points_won_param,
    total_earned = current_total_earned + points_won_param,
    updated_at = now()
  WHERE id = user_id_param;
  
  RETURN true;
END;
$$;