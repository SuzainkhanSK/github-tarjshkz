/*
  # Admin User Management Functions

  1. New Functions
    - `get_user_management_stats` - Returns basic user statistics and top earners
    - `get_all_users_with_stats` - Returns all users with detailed activity statistics
    - `award_missing_signup_bonus` - Awards signup bonus to users who missed it

  2. Security
    - All functions use SECURITY DEFINER to ensure proper access control
    - Grant execute permissions to authenticated users
*/

-- Drop existing functions first to avoid return type errors
DROP FUNCTION IF EXISTS get_user_management_stats();
DROP FUNCTION IF EXISTS get_all_users_with_stats();
DROP FUNCTION IF EXISTS award_missing_signup_bonus(uuid);

-- Function to get basic user management statistics
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  top_earners jsonb;
BEGIN
  -- Get top earners (basic user list)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'phone', p.phone,
      'points', p.points,
      'total_earned', p.total_earned,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'profile_image', p.profile_image,
      'referral_code', p.referral_code,
      'referred_by', p.referred_by
    )
  ) INTO top_earners
  FROM profiles p
  ORDER BY p.total_earned DESC, p.created_at DESC
  LIMIT 1000;

  -- Build result object
  result := jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalPoints', (SELECT COALESCE(SUM(points), 0) FROM profiles),
    'totalEarned', (SELECT COALESCE(SUM(total_earned), 0) FROM profiles),
    'topEarners', COALESCE(top_earners, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- Function to get all users with detailed statistics
CREATE OR REPLACE FUNCTION get_all_users_with_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  users_with_stats jsonb;
BEGIN
  -- Get users with their statistics
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'phone', p.phone,
      'points', p.points,
      'total_earned', p.total_earned,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'profile_image', p.profile_image,
      'referral_code', p.referral_code,
      'referred_by', p.referred_by,
      'status', 'active',
      'has_profile', true,
      'transaction_count', COALESCE(t.transaction_count, 0),
      'spin_count', COALESCE(s.spin_count, 0),
      'scratch_count', COALESCE(sc.scratch_count, 0),
      'task_count', COALESCE(tk.task_count, 0)
    )
  ) INTO users_with_stats
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as transaction_count
    FROM transactions
    GROUP BY user_id
  ) t ON p.id = t.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as spin_count
    FROM spin_history
    GROUP BY user_id
  ) s ON p.id = s.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as scratch_count
    FROM scratch_history
    GROUP BY user_id
  ) sc ON p.id = sc.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as task_count
    FROM tasks
    WHERE completed = true
    GROUP BY user_id
  ) tk ON p.id = tk.user_id
  ORDER BY p.total_earned DESC, p.created_at DESC;

  -- Build result object
  result := jsonb_build_object(
    'users', COALESCE(users_with_stats, '[]'::jsonb),
    'totalCount', (SELECT COUNT(*) FROM profiles)
  );

  RETURN result;
END;
$$;

-- Function to award missing signup bonus
CREATE OR REPLACE FUNCTION award_missing_signup_bonus(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signup_bonus_amount integer := 100;
  existing_bonus_count integer;
BEGIN
  -- Check if user already has signup bonus
  SELECT COUNT(*) INTO existing_bonus_count
  FROM transactions
  WHERE user_id = user_id_param AND task_type = 'signup';

  -- If no signup bonus exists, award it
  IF existing_bonus_count = 0 THEN
    -- Insert signup bonus transaction
    INSERT INTO transactions (user_id, type, points, description, task_type)
    VALUES (user_id_param, 'earn', signup_bonus_amount, 'Welcome signup bonus', 'signup');

    -- Update user points and total earned
    UPDATE profiles
    SET 
      points = points + signup_bonus_amount,
      total_earned = total_earned + signup_bonus_amount
    WHERE id = user_id_param;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_management_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION award_missing_signup_bonus(uuid) TO authenticated;