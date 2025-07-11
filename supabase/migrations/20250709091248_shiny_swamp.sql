/*
  # Fix ambiguous column reference in user management functions

  1. Database Functions
    - Drop and recreate `get_user_management_stats` function with proper table aliases
    - Drop and recreate `get_all_users_with_stats` function with proper table aliases
    - Fix ambiguous column references for `total_earned` and other columns

  2. Changes Made
    - Add proper table aliases (p for profiles, t for transactions, etc.)
    - Explicitly qualify all column references to avoid ambiguity
    - Ensure consistent naming and structure across functions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_management_stats();
DROP FUNCTION IF EXISTS get_all_users_with_stats();

-- Create improved get_user_management_stats function
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  top_earners JSON;
  total_users INTEGER;
  active_users INTEGER;
  total_points BIGINT;
  total_earned_sum BIGINT;
BEGIN
  -- Get basic stats
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO active_users FROM profiles WHERE points > 0;
  SELECT COALESCE(SUM(p.points), 0) INTO total_points FROM profiles p;
  SELECT COALESCE(SUM(p.total_earned), 0) INTO total_earned_sum FROM profiles p;

  -- Get top earners with proper aliases
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
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
  ORDER BY p.total_earned DESC, p.points DESC
  LIMIT 100;

  -- Build final result
  result := JSON_BUILD_OBJECT(
    'totalUsers', total_users,
    'activeUsers', active_users,
    'totalPoints', total_points,
    'totalEarned', total_earned_sum,
    'topEarners', COALESCE(top_earners, '[]'::JSON)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved get_all_users_with_stats function
CREATE OR REPLACE FUNCTION get_all_users_with_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  users_data JSON;
BEGIN
  -- Get all users with their stats using proper aliases
  SELECT JSON_BUILD_OBJECT(
    'users', JSON_AGG(
      JSON_BUILD_OBJECT(
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
        'transaction_count', COALESCE(stats.transaction_count, 0),
        'spin_count', COALESCE(stats.spin_count, 0),
        'scratch_count', COALESCE(stats.scratch_count, 0),
        'task_count', COALESCE(stats.task_count, 0)
      )
    )
  ) INTO result
  FROM profiles p
  LEFT JOIN (
    SELECT 
      p2.id as user_id,
      COUNT(DISTINCT t.id) as transaction_count,
      COUNT(DISTINCT sp.id) as spin_count,
      COUNT(DISTINCT sc.id) as scratch_count,
      COUNT(DISTINCT tk.id) as task_count
    FROM profiles p2
    LEFT JOIN transactions t ON t.user_id = p2.id
    LEFT JOIN spin_history sp ON sp.user_id = p2.id
    LEFT JOIN scratch_history sc ON sc.user_id = p2.id
    LEFT JOIN tasks tk ON tk.user_id = p2.id
    GROUP BY p2.id
  ) stats ON stats.user_id = p.id
  ORDER BY p.total_earned DESC, p.points DESC;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_management_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_stats() TO authenticated;