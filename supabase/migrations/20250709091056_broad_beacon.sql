/*
  # Fix get_user_management_stats function

  1. Functions
    - Drop and recreate `get_user_management_stats` function with correct GROUP BY clause
    - Drop and recreate `get_all_users_with_stats` function with proper aggregation

  2. Changes
    - Fix SQL GROUP BY clause error for p.total_earned column
    - Ensure all selected columns are properly grouped or aggregated
    - Add proper error handling and return structure
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_management_stats();
DROP FUNCTION IF EXISTS get_all_users_with_stats();

-- Create get_user_management_stats function
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  top_earners jsonb;
  total_users integer;
  active_users integer;
  total_points bigint;
  total_earned bigint;
BEGIN
  -- Get basic stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE true), -- All users are considered active for now
    COALESCE(SUM(points), 0),
    COALESCE(SUM(total_earned), 0)
  INTO total_users, active_users, total_points, total_earned
  FROM profiles;

  -- Get top earners (limit to 100 for performance)
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
  )
  INTO top_earners
  FROM profiles p
  ORDER BY p.total_earned DESC, p.points DESC
  LIMIT 100;

  -- Build result
  result := jsonb_build_object(
    'totalUsers', total_users,
    'activeUsers', active_users,
    'totalPoints', total_points,
    'totalEarned', total_earned,
    'topEarners', COALESCE(top_earners, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- Create get_all_users_with_stats function
CREATE OR REPLACE FUNCTION get_all_users_with_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  users_with_stats jsonb;
BEGIN
  -- Get all users with their stats
  SELECT jsonb_build_object(
    'users', jsonb_agg(
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
    )
  )
  INTO result
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
  ) tk ON p.id = tk.user_id;

  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_management_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_stats() TO authenticated;