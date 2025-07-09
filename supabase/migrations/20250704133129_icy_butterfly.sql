/*
  # Watch Ads Task System

  1. New Tables
    - `earning_task_completions`
      - Tracks ad views and other earning tasks
      - Records points earned, status, and verification data
      - Includes timestamps for tracking

  2. Security
    - Enable RLS on earning_task_completions table
    - Add policies for users to manage their own task completions
    - Prevent policy creation errors with existence checks

  3. Functions
    - Check daily ad view limits
    - Process ad view completions with tiered rewards
*/

-- Create earning_task_completions table
CREATE TABLE IF NOT EXISTS earning_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reviewing')),
  coins_earned integer NOT NULL DEFAULT 0 CHECK (coins_earned >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  verification_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE earning_task_completions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_earning_completions_user_id ON earning_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_completions_task_id ON earning_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_earning_completions_status ON earning_task_completions(status);
CREATE INDEX IF NOT EXISTS idx_earning_completions_started_at ON earning_task_completions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_earning_completions_user_status ON earning_task_completions(user_id, status);

-- RLS Policies for earning_task_completions - with existence checks
DO $$
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'earning_task_completions' AND policyname = 'Users can read own task completions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own task completions"
      ON earning_task_completions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'earning_task_completions' AND policyname = 'Users can insert own task completions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own task completions"
      ON earning_task_completions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'earning_task_completions' AND policyname = 'Users can update own task completions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own task completions"
      ON earning_task_completions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Function to check daily ad view limit
CREATE OR REPLACE FUNCTION check_daily_ad_view_limit(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ads_viewed_today integer;
  max_daily_ads integer := 10;
  result json;
BEGIN
  -- Count ads viewed today
  SELECT COUNT(*)
  INTO ads_viewed_today
  FROM earning_task_completions
  WHERE user_id = user_id_param
    AND task_id LIKE 'ad_view%'
    AND status = 'completed'
    AND completed_at >= CURRENT_DATE
    AND completed_at < CURRENT_DATE + INTERVAL '1 day';
  
  -- Build result JSON
  result := json_build_object(
    'ads_viewed', ads_viewed_today,
    'max_daily_ads', max_daily_ads,
    'remaining', GREATEST(0, max_daily_ads - ads_viewed_today),
    'can_view_more', ads_viewed_today < max_daily_ads
  );
  
  RETURN result;
END;
$$;

-- Function to process ad view completion
CREATE OR REPLACE FUNCTION process_ad_view_completion(
  user_id_param uuid,
  task_id_param text,
  provider_param text,
  verification_data_param jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ad_limit_info json;
  current_points integer;
  current_total_earned integer;
  points_to_award integer := 50; -- Base points per ad view
  completion_id uuid;
  result json;
BEGIN
  -- Check if user is authenticated and is the same user
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only process your own ad views';
  END IF;

  -- Check daily ad view limit
  SELECT check_daily_ad_view_limit(user_id_param) INTO ad_limit_info;
  
  IF NOT (ad_limit_info->>'can_view_more')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Daily ad view limit reached',
      'limit_info', ad_limit_info
    );
  END IF;

  -- Get current user points
  SELECT points, total_earned
  INTO current_points, current_total_earned
  FROM profiles
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;
  
  -- Calculate points based on ads viewed today
  -- More ads watched = more points per ad (incentivizes watching multiple ads)
  IF (ad_limit_info->>'ads_viewed')::integer >= 8 THEN
    points_to_award := 100; -- 8-10 ads: 100 points each
  ELSIF (ad_limit_info->>'ads_viewed')::integer >= 5 THEN
    points_to_award := 75; -- 5-7 ads: 75 points each
  ELSIF (ad_limit_info->>'ads_viewed')::integer >= 3 THEN
    points_to_award := 60; -- 3-4 ads: 60 points each
  END IF;
  
  -- Insert task completion record
  INSERT INTO earning_task_completions (
    user_id,
    task_id,
    provider,
    status,
    coins_earned,
    completed_at,
    verification_data
  ) VALUES (
    user_id_param,
    task_id_param,
    provider_param,
    'completed',
    points_to_award,
    now(),
    verification_data_param
  )
  RETURNING id INTO completion_id;
  
  -- Insert transaction
  INSERT INTO transactions (
    user_id,
    type,
    points,
    description,
    task_type
  ) VALUES (
    user_id_param,
    'earn',
    points_to_award,
    'Watched Ad: ' || points_to_award || ' points earned',
    'ad_view'
  );
  
  -- Update user profile
  UPDATE profiles
  SET 
    points = current_points + points_to_award,
    total_earned = current_total_earned + points_to_award,
    updated_at = now()
  WHERE id = user_id_param;
  
  -- Get updated limit info
  SELECT check_daily_ad_view_limit(user_id_param) INTO ad_limit_info;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'message', 'Ad view completed successfully',
    'points_earned', points_to_award,
    'completion_id', completion_id,
    'limit_info', ad_limit_info
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_daily_ad_view_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_ad_view_completion(uuid, text, text, jsonb) TO authenticated;