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
  ORDER BY p.total_earned DESC, p.points DESC
  LIMIT 100;

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
BEGIN
  -- Get all users first
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
  FROM profiles p
  ORDER BY p.created_at DESC;

  -- Add stats to each user
  WITH user_stats AS (
    SELECT 
      p.id AS user_id,
      COUNT(DISTINCT t.id) AS transaction_count,
      COUNT(DISTINCT s.id) AS spin_count,
      COUNT(DISTINCT sc.id) AS scratch_count,
      COUNT(DISTINCT CASE WHEN tk.completed THEN tk.id END) AS task_count
    FROM profiles p
    LEFT JOIN transactions t ON p.id = t.user_id
    LEFT JOIN spin_history s ON p.id = s.user_id
    LEFT JOIN scratch_history sc ON p.id = sc.user_id
    LEFT JOIN tasks tk ON p.id = tk.user_id
    GROUP BY p.id
  )
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', u->>'id',
      'email', u->>'email',
      'full_name', u->>'full_name',
      'phone', u->>'phone',
      'points', (u->>'points')::integer,
      'total_earned', (u->>'total_earned')::integer,
      'created_at', u->>'created_at',
      'updated_at', u->>'updated_at',
      'profile_image', u->>'profile_image',
      'referral_code', u->>'referral_code',
      'referred_by', u->>'referred_by',
      'status', u->>'status',
      'has_profile', (u->>'has_profile')::boolean,
      'transaction_count', COALESCE(us.transaction_count, 0),
      'spin_count', COALESCE(us.spin_count, 0),
      'scratch_count', COALESCE(us.scratch_count, 0),
      'task_count', COALESCE(us.task_count, 0)
    )
  ) INTO users_data
  FROM JSON_ARRAY_ELEMENTS(users_data) AS u
  LEFT JOIN user_stats us ON us.user_id = (u->>'id')::uuid;

  -- Build final result
  result := JSON_BUILD_OBJECT(
    'users', COALESCE(users_data, '[]'::JSON),
    'totalCount', (SELECT COUNT(*) FROM profiles)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award missing signup bonus (recreated for completeness)
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