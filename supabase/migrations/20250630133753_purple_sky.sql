/*
  # Dashboard Stats Function

  1. New Functions
    - `get_user_dashboard_stats`
      - Accepts user_id, today's date, and week ago date
      - Returns JSON with dashboard statistics
      - Includes today's earnings, weekly earnings, tasks completed, and total transactions

  2. Security
    - Function is SECURITY DEFINER to ensure proper access control
    - Grant execute permission to authenticated users
*/

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(
  user_id_param uuid,
  today_param text,
  week_ago_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  today_earned integer := 0;
  weekly_earned integer := 0;
  tasks_completed integer := 0;
  total_transactions integer := 0;
BEGIN
  -- Get today's earnings
  SELECT COALESCE(SUM(points), 0) INTO today_earned
  FROM transactions
  WHERE user_id = user_id_param
    AND type = 'earn'
    AND DATE(created_at) = today_param::date;

  -- Get weekly earnings
  SELECT COALESCE(SUM(points), 0) INTO weekly_earned
  FROM transactions
  WHERE user_id = user_id_param
    AND type = 'earn'
    AND created_at >= week_ago_param::timestamptz;

  -- Get completed tasks count
  SELECT COALESCE(COUNT(*), 0) INTO tasks_completed
  FROM tasks
  WHERE user_id = user_id_param
    AND completed = true;

  -- Get total transactions count
  SELECT COALESCE(COUNT(*), 0) INTO total_transactions
  FROM transactions
  WHERE user_id = user_id_param;

  -- Build result JSON
  result := json_build_object(
    'todayEarned', today_earned,
    'weeklyEarned', weekly_earned,
    'tasksCompleted', tasks_completed,
    'totalTransactions', total_transactions
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid, text, text) TO authenticated;