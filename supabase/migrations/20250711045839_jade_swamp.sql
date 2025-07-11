/*
  # Admin Panel Function Fixes

  1. New Functions
    - `get_admin_dashboard_stats`: Returns aggregated statistics for the admin dashboard
    - `get_admin_recent_activity`: Returns recent user activity for the admin dashboard
    - `get_leaderboard_users`: Returns top users for the leaderboard
  
  2. Security
    - All functions are accessible only to authenticated users
    - Functions use proper table aliases to avoid ambiguous column references
*/

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS get_admin_recent_activity();
DROP FUNCTION IF EXISTS get_leaderboard_users(integer);

-- Create improved admin dashboard stats function
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH user_counts AS (
    SELECT 
      COUNT(*) AS total_users,
      COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS active_users,
      COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS today_signups
    FROM profiles
  ),
  point_stats AS (
    SELECT 
      COALESCE(SUM(p.points), 0) AS total_points,
      COALESCE(SUM(CASE WHEN t.created_at > CURRENT_DATE - INTERVAL '1 day' AND t.type = 'earn' THEN t.points ELSE 0 END), 0) AS today_earnings
    FROM profiles p
    LEFT JOIN transactions t ON p.id = t.user_id
  ),
  redemption_stats AS (
    SELECT
      COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_redemptions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_redemptions
    FROM redemption_requests
  ),
  game_stats AS (
    SELECT
      (SELECT COUNT(*) FROM spin_history) AS total_spins,
      (SELECT COUNT(*) FROM scratch_history) AS total_scratches,
      (SELECT COUNT(*) FROM tasks WHERE completed = true) AS total_tasks
    FROM (SELECT 1) AS dummy
  )
  SELECT 
    json_build_object(
      'totalUsers', (SELECT total_users FROM user_counts),
      'activeUsers', (SELECT active_users FROM user_counts),
      'todaySignups', (SELECT today_signups FROM user_counts),
      'totalPoints', (SELECT total_points FROM point_stats),
      'todayEarnings', (SELECT today_earnings FROM point_stats),
      'pendingRedemptions', (SELECT pending_redemptions FROM redemption_stats),
      'completedRedemptions', (SELECT completed_redemptions FROM redemption_stats),
      'totalSpins', (SELECT total_spins FROM game_stats),
      'totalScratches', (SELECT total_scratches FROM game_stats),
      'totalTasks', (SELECT total_tasks FROM game_stats)
    ) INTO result;
    
  RETURN result;
END;
$$;

-- Create improved admin recent activity function
CREATE OR REPLACE FUNCTION get_admin_recent_activity()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  recent_transactions json;
  recent_redemptions json;
BEGIN
  -- Get recent transactions with user email
  SELECT json_agg(t) INTO recent_transactions
  FROM (
    SELECT 
      t.id,
      t.user_id,
      t.type,
      t.points,
      t.description,
      t.task_type,
      t.created_at,
      p.email AS user_email
    FROM transactions t
    JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC
    LIMIT 10
  ) t;
  
  -- Get recent redemption requests
  SELECT json_agg(r) INTO recent_redemptions
  FROM (
    SELECT 
      r.id,
      r.user_id,
      r.subscription_id,
      r.subscription_name,
      r.duration,
      r.points_cost,
      r.status,
      r.user_email,
      r.created_at
    FROM redemption_requests r
    ORDER BY r.created_at DESC
    LIMIT 10
  ) r;
  
  -- Combine results
  SELECT json_build_object(
    'transactions', COALESCE(recent_transactions, '[]'::json),
    'redemptions', COALESCE(recent_redemptions, '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create improved leaderboard users function
CREATE OR REPLACE FUNCTION get_leaderboard_users(limit_param integer DEFAULT 10)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.*
  FROM profiles p
  ORDER BY p.points DESC
  LIMIT limit_param;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_recent_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_users(integer) TO authenticated;