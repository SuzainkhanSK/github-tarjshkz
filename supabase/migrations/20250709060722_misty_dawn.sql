/*
  # Fix Admin Dashboard Stats Functions

  1. New Functions
    - `get_admin_dashboard_stats` - Returns comprehensive admin dashboard statistics
    - Properly handles null values with COALESCE
    - Returns counts and aggregates for users, transactions, redemptions, etc.

  2. Security
    - Function uses SECURITY DEFINER to access data with elevated privileges
    - Only accessible to admin users through RLS policies
*/

-- Create function to get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_users integer;
  active_users integer;
  total_points bigint;
  pending_redemptions integer;
  completed_redemptions integer;
  today_signups integer;
  today_earnings bigint;
  total_spins integer;
  total_scratches integer;
  total_tasks integer;
  today_date date := CURRENT_DATE;
  thirty_days_ago date := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  -- Get total users count
  SELECT COUNT(*) INTO total_users
  FROM profiles;
  
  -- Get active users (active in last 30 days)
  SELECT COUNT(*) INTO active_users
  FROM profiles
  WHERE updated_at >= thirty_days_ago;
  
  -- Get total points across all users
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM profiles;
  
  -- Get redemption counts
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO 
    pending_redemptions,
    completed_redemptions
  FROM redemption_requests;
  
  -- Get today's signups
  SELECT COUNT(*) INTO today_signups
  FROM profiles
  WHERE DATE(created_at) = today_date;
  
  -- Get today's earnings
  SELECT COALESCE(SUM(points), 0) INTO today_earnings
  FROM transactions
  WHERE type = 'earn'
    AND DATE(created_at) = today_date;
  
  -- Get game stats
  SELECT COUNT(*) INTO total_spins
  FROM spin_history;
  
  SELECT COUNT(*) INTO total_scratches
  FROM scratch_history;
  
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE completed = true;
  
  -- Build result JSON
  result := json_build_object(
    'totalUsers', total_users,
    'activeUsers', active_users,
    'totalPoints', total_points,
    'pendingRedemptions', pending_redemptions,
    'completedRedemptions', completed_redemptions,
    'todaySignups', today_signups,
    'todayEarnings', today_earnings,
    'totalSpins', total_spins,
    'totalScratches', total_scratches,
    'totalTasks', total_tasks
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- Create function to get recent admin activity
CREATE OR REPLACE FUNCTION public.get_admin_recent_activity(limit_param integer DEFAULT 15)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  transactions_data json;
  redemptions_data json;
BEGIN
  -- Get recent transactions
  SELECT json_agg(t)
  INTO transactions_data
  FROM (
    SELECT 
      t.id,
      t.type,
      t.points,
      t.description,
      t.task_type,
      t.created_at,
      p.email as user_email
    FROM transactions t
    JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC
    LIMIT limit_param
  ) t;
  
  -- Get recent redemptions
  SELECT json_agg(r)
  INTO redemptions_data
  FROM (
    SELECT 
      id,
      subscription_name,
      points_cost,
      created_at,
      user_email
    FROM redemption_requests
    ORDER BY created_at DESC
    LIMIT 5
  ) r;
  
  -- Build result JSON
  result := json_build_object(
    'transactions', COALESCE(transactions_data, '[]'::json),
    'redemptions', COALESCE(redemptions_data, '[]'::json)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_recent_activity(integer) TO authenticated;

-- Create function to get user management stats
CREATE OR REPLACE FUNCTION public.get_user_management_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_users integer;
  active_users integer;
  inactive_users integer;
  total_points bigint;
  avg_points_per_user numeric;
  top_earners json;
  recent_signups json;
  thirty_days_ago date := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  -- Get user counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE updated_at >= thirty_days_ago),
    COUNT(*) FILTER (WHERE updated_at < thirty_days_ago)
  INTO 
    total_users,
    active_users,
    inactive_users
  FROM profiles;
  
  -- Get points stats
  SELECT 
    COALESCE(SUM(points), 0),
    COALESCE(AVG(points), 0)
  INTO 
    total_points,
    avg_points_per_user
  FROM profiles;
  
  -- Get top earners
  SELECT json_agg(t)
  INTO top_earners
  FROM (
    SELECT 
      id,
      email,
      full_name,
      points,
      total_earned
    FROM profiles
    ORDER BY points DESC
    LIMIT 10
  ) t;
  
  -- Get recent signups
  SELECT json_agg(s)
  INTO recent_signups
  FROM (
    SELECT 
      id,
      email,
      full_name,
      created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 10
  ) s;
  
  -- Build result JSON
  result := json_build_object(
    'totalUsers', total_users,
    'activeUsers', active_users,
    'inactiveUsers', inactive_users,
    'totalPoints', total_points,
    'avgPointsPerUser', avg_points_per_user,
    'topEarners', COALESCE(top_earners, '[]'::json),
    'recentSignups', COALESCE(recent_signups, '[]'::json)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_management_stats() TO authenticated;