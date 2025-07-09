/*
  # Fix Dashboard Stats Function

  1. Updates
    - Create a new version of the get_user_dashboard_stats function
    - Ensure it accepts both date and text parameters for today_param
    - Ensure it accepts both timestamptz and text parameters for week_ago_param
    - This resolves the function overloading conflict

  2. Security
    - Maintain existing security settings
    - Function remains SECURITY DEFINER
    - Grant execute permissions to authenticated users
*/

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.get_user_dashboard_stats(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_user_dashboard_stats(uuid, date, timestamptz);

-- Create a new function that handles both parameter types
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
  today_date date;
  week_ago_timestamp timestamptz;
  today_earned integer := 0;
  weekly_earned integer := 0;
  tasks_completed integer := 0;
  total_transactions integer := 0;
BEGIN
  -- Convert parameters to proper types
  BEGIN
    today_date := today_param::date;
  EXCEPTION WHEN OTHERS THEN
    today_date := CURRENT_DATE;
  END;
  
  BEGIN
    week_ago_timestamp := week_ago_param::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    week_ago_timestamp := CURRENT_TIMESTAMP - INTERVAL '7 days';
  END;

  -- Get today's earnings
  SELECT COALESCE(SUM(points), 0) INTO today_earned
  FROM transactions
  WHERE user_id = user_id_param
    AND type = 'earn'
    AND DATE(created_at) = today_date;

  -- Get weekly earnings
  SELECT COALESCE(SUM(points), 0) INTO weekly_earned
  FROM transactions
  WHERE user_id = user_id_param
    AND type = 'earn'
    AND created_at >= week_ago_timestamp;

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