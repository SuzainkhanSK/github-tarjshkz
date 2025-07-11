/*
  # Fix User Management Functionality

  1. New Functions
    - `get_user_profiles_with_stats`: Retrieves user profiles with activity statistics
    - `is_admin_email`: Helper function to check if a user is an admin based on email

  2. Security
    - All functions use SECURITY DEFINER to bypass RLS
    - Admin check is based on email list for simplicity
*/

-- Create a function to check if a user is an admin based on email
CREATE OR REPLACE FUNCTION public.is_admin_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email IN (
    'suzainkhan8360@gmail.com',
    'Suzainkhan8360@gmail.com',
    'admin@premiumaccesszone.com',
    'support@premiumaccesszone.com',
    'moderator@premiumaccesszone.com'
  );
END;
$$;

-- Create a function to get user profiles with activity statistics
CREATE OR REPLACE FUNCTION public.get_user_profiles_with_stats()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Get the current user's email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the user is an admin
  IF NOT is_admin_email(current_user_email) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can view all profiles';
  END IF;

  RETURN QUERY
  WITH transaction_counts AS (
    SELECT 
      user_id, 
      COUNT(*) as transaction_count
    FROM transactions
    GROUP BY user_id
  ),
  spin_counts AS (
    SELECT 
      user_id, 
      COUNT(*) as spin_count
    FROM spin_history
    GROUP BY user_id
  ),
  scratch_counts AS (
    SELECT 
      user_id, 
      COUNT(*) as scratch_count
    FROM scratch_history
    GROUP BY user_id
  ),
  task_counts AS (
    SELECT 
      user_id, 
      COUNT(*) as task_count
    FROM tasks
    WHERE completed = true
    GROUP BY user_id
  )
  SELECT 
    json_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'phone', p.phone,
      'points', p.points,
      'total_earned', p.total_earned,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'transaction_count', COALESCE(tc.transaction_count, 0),
      'spin_count', COALESCE(sc.spin_count, 0),
      'scratch_count', COALESCE(stc.scratch_count, 0),
      'task_count', COALESCE(tac.task_count, 0)
    )
  FROM 
    profiles p
    LEFT JOIN transaction_counts tc ON p.id = tc.user_id
    LEFT JOIN spin_counts sc ON p.id = sc.user_id
    LEFT JOIN scratch_counts stc ON p.id = stc.user_id
    LEFT JOIN task_counts tac ON p.id = tac.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create a function to get admin dashboard recent activity
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity(limit_param INTEGER DEFAULT 20)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
  result json;
BEGIN
  -- Get the current user's email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the user is an admin
  IF NOT is_admin_email(current_user_email) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can view recent activity';
  END IF;

  -- Get recent transactions with user emails
  WITH recent_transactions AS (
    SELECT 
      t.id,
      t.user_id,
      t.type,
      t.points,
      t.description,
      t.task_type,
      t.created_at,
      p.email as user_email
    FROM 
      transactions t
      JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC
    LIMIT limit_param
  ),
  -- Get recent redemptions
  recent_redemptions AS (
    SELECT 
      id,
      user_id,
      subscription_id,
      subscription_name,
      duration,
      points_cost,
      status,
      user_email,
      created_at
    FROM 
      redemption_requests
    ORDER BY created_at DESC
    LIMIT limit_param
  )
  SELECT json_build_object(
    'transactions', (SELECT json_agg(t) FROM recent_transactions t),
    'redemptions', (SELECT json_agg(r) FROM recent_redemptions r)
  ) INTO result;

  RETURN result;
END;
$$;

-- Create a function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
  result json;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get the current user's email
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the user is an admin
  IF NOT is_admin_email(current_user_email) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can view dashboard stats';
  END IF;

  -- Calculate all stats in one query
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'activeUsers', (SELECT COUNT(*) FROM profiles WHERE updated_at > (CURRENT_DATE - INTERVAL '30 days')),
    'totalTransactions', (SELECT COUNT(*) FROM transactions),
    'totalPoints', (SELECT SUM(points) FROM profiles),
    'pendingRedemptions', (SELECT COUNT(*) FROM redemption_requests WHERE status = 'pending'),
    'completedRedemptions', (SELECT COUNT(*) FROM redemption_requests WHERE status = 'completed'),
    'todaySignups', (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = today_date),
    'todayEarnings', (SELECT COALESCE(SUM(points), 0) FROM transactions WHERE type = 'earn' AND DATE(created_at) = today_date),
    'totalSpins', (SELECT COUNT(*) FROM spin_history),
    'totalScratches', (SELECT COUNT(*) FROM scratch_history),
    'totalTasks', (SELECT COUNT(*) FROM tasks WHERE completed = true)
  ) INTO result;

  RETURN result;
END;
$$;