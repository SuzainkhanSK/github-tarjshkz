-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_management_stats();
DROP FUNCTION IF EXISTS get_all_users_with_stats();

-- Create improved get_user_management_stats function
CREATE OR REPLACE FUNCTION get_user_management_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
  top_earners JSON;
BEGIN
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
  ORDER BY p.created_at DESC
  LIMIT 1000;

  -- Build final result
  result := JSON_BUILD_OBJECT(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'activeUsers', (SELECT COUNT(*) FROM profiles WHERE points > 0),
    'totalPoints', (SELECT COALESCE(SUM(points), 0) FROM profiles),
    'totalEarned', (SELECT COALESCE(SUM(total_earned), 0) FROM profiles),
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
  stats_data JSON;
BEGIN
  -- First, get all users
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
      'referred_by', p.referred_by,
      'status', 'active',
      'has_profile', true
    )
  ) INTO users_data
  FROM profiles p;

  -- Then, get all stats separately
  WITH user_stats AS (
    SELECT 
      p.id AS user_id,
      COUNT(t.id) AS transaction_count,
      0 AS spin_count,
      0 AS scratch_count,
      0 AS task_count
    FROM profiles p
    LEFT JOIN transactions t ON p.id = t.user_id
    GROUP BY p.id
  ),
  spin_stats AS (
    SELECT 
      p.id AS user_id,
      COUNT(s.id) AS spin_count
    FROM profiles p
    LEFT JOIN spin_history s ON p.id = s.user_id
    GROUP BY p.id
  ),
  scratch_stats AS (
    SELECT 
      p.id AS user_id,
      COUNT(sc.id) AS scratch_count
    FROM profiles p
    LEFT JOIN scratch_history sc ON p.id = sc.user_id
    GROUP BY p.id
  ),
  task_stats AS (
    SELECT 
      p.id AS user_id,
      COUNT(tk.id) FILTER (WHERE tk.completed = true) AS task_count
    FROM profiles p
    LEFT JOIN tasks tk ON p.id = tk.user_id
    GROUP BY p.id
  )
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
      'referred_by', p.referred_by,
      'status', 'active',
      'has_profile', true,
      'transaction_count', COALESCE(us.transaction_count, 0),
      'spin_count', COALESCE(ss.spin_count, 0),
      'scratch_count', COALESCE(scs.scratch_count, 0),
      'task_count', COALESCE(ts.task_count, 0)
    )
  ) INTO users_data
  FROM profiles p
  LEFT JOIN user_stats us ON p.id = us.user_id
  LEFT JOIN spin_stats ss ON p.id = ss.user_id
  LEFT JOIN scratch_stats scs ON p.id = scs.user_id
  LEFT JOIN task_stats ts ON p.id = ts.user_id
  ORDER BY p.created_at DESC;

  -- Build final result
  result := JSON_BUILD_OBJECT(
    'users', COALESCE(users_data, '[]'::JSON),
    'totalCount', (SELECT COUNT(*) FROM profiles)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_management_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_with_stats() TO authenticated;