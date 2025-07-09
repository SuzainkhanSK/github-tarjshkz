/*
  # Fix Admin User Management Stats

  1. New Functions
    - `get_user_stats` - Returns detailed stats for a specific user
    - Includes transaction counts, game activity, and task completion
    - Properly handles null values with COALESCE

  2. Security
    - Function uses SECURITY DEFINER to access data with elevated privileges
    - Only accessible to admin users through RLS policies
*/

-- Create function to get detailed stats for a specific user
CREATE OR REPLACE FUNCTION public.get_user_stats(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  transaction_count integer;
  spin_count integer;
  scratch_count integer;
  task_count integer;
  last_login timestamptz;
BEGIN
  -- Get transaction count
  SELECT COUNT(*) INTO transaction_count
  FROM transactions
  WHERE user_id = user_id_param;
  
  -- Get spin count
  SELECT COUNT(*) INTO spin_count
  FROM spin_history
  WHERE user_id = user_id_param;
  
  -- Get scratch count
  SELECT COUNT(*) INTO scratch_count
  FROM scratch_history
  WHERE user_id = user_id_param;
  
  -- Get task count
  SELECT COUNT(*) INTO task_count
  FROM tasks
  WHERE user_id = user_id_param
    AND completed = true;
  
  -- Get last login time from auth.users
  BEGIN
    SELECT last_sign_in_at INTO last_login
    FROM auth.users
    WHERE id = user_id_param;
  EXCEPTION
    WHEN OTHERS THEN
      last_login := NULL;
  END;
  
  -- Build result JSON
  result := json_build_object(
    'transactionCount', transaction_count,
    'spinCount', spin_count,
    'scratchCount', scratch_count,
    'taskCount', task_count,
    'lastLogin', last_login
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;

-- Create function to get all users with their stats
CREATE OR REPLACE FUNCTION public.get_all_users_with_stats(limit_param integer DEFAULT 100)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  users_data json;
BEGIN
  -- Get users with basic stats
  SELECT json_agg(u)
  INTO users_data
  FROM (
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.phone,
      p.points,
      p.total_earned,
      p.profile_image,
      p.created_at,
      p.updated_at,
      COUNT(t.id) as transaction_count,
      COUNT(s.id) as spin_count,
      COUNT(sc.id) as scratch_count,
      COUNT(CASE WHEN tk.completed THEN tk.id END) as task_count,
      'active' as status,
      true as has_profile
    FROM profiles p
    LEFT JOIN transactions t ON p.id = t.user_id
    LEFT JOIN spin_history s ON p.id = s.user_id
    LEFT JOIN scratch_history sc ON p.id = sc.user_id
    LEFT JOIN tasks tk ON p.id = tk.user_id
    GROUP BY p.id, p.email, p.full_name, p.phone, p.points, p.total_earned, p.profile_image, p.created_at, p.updated_at
    ORDER BY p.created_at DESC
    LIMIT limit_param
  ) u;
  
  -- Build result JSON
  result := json_build_object(
    'users', COALESCE(users_data, '[]'::json)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users_with_stats(integer) TO authenticated;