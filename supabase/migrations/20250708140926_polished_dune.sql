/*
  # Leaderboard Function

  1. New Functions
    - `get_leaderboard_users` - Returns users sorted by points for the leaderboard
    - Returns individual columns instead of the whole profiles row type
    - Properly handles null values with COALESCE

  2. Security
    - Function uses SECURITY DEFINER to access data with elevated privileges
    - Accessible to both authenticated and anonymous users
*/

-- Create function to get top users for leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard_users(limit_param integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  points integer,
  profile_image text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id, 
    email, 
    full_name, 
    COALESCE(points, 0) as points, 
    profile_image, 
    created_at
  FROM profiles
  ORDER BY COALESCE(points, 0) DESC
  LIMIT limit_param;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_leaderboard_users(integer) TO authenticated, anon;