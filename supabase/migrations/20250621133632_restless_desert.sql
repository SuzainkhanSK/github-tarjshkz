/*
  # Performance Optimization Database Functions and Indexes

  1. Functions
    - Dashboard stats aggregation function
    - Batch point updates function
    - Database performance monitoring function
    - User stats refresh function
    - Data cleanup function

  2. Indexes
    - Composite indexes for better query performance
    - Partial indexes for recent data
    - Materialized view for user statistics

  3. Performance Optimizations
    - Single-query dashboard stats
    - Batch operations for point updates
    - Materialized view for complex aggregations
    - Automatic data cleanup
*/

-- Function to get dashboard stats in a single query
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(
  user_id_param uuid,
  today_param date,
  week_ago_param timestamptz
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'todayEarned', COALESCE(today_earned.points, 0),
    'weeklyEarned', COALESCE(weekly_earned.points, 0),
    'tasksCompleted', COALESCE(tasks_completed.count, 0),
    'totalTransactions', COALESCE(total_transactions.count, 0)
  ) INTO result
  FROM (
    -- Today's earnings
    SELECT COALESCE(SUM(points), 0) as points
    FROM transactions
    WHERE user_id = user_id_param
    AND type = 'earn'
    AND created_at::date = today_param
  ) today_earned
  CROSS JOIN (
    -- Weekly earnings
    SELECT COALESCE(SUM(points), 0) as points
    FROM transactions
    WHERE user_id = user_id_param
    AND type = 'earn'
    AND created_at >= week_ago_param
  ) weekly_earned
  CROSS JOIN (
    -- Tasks completed
    SELECT COUNT(*) as count
    FROM tasks
    WHERE user_id = user_id_param
    AND completed = true
  ) tasks_completed
  CROSS JOIN (
    -- Total transactions
    SELECT COUNT(*) as count
    FROM transactions
    WHERE user_id = user_id_param
  ) total_transactions;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for batch point updates
CREATE OR REPLACE FUNCTION batch_update_user_points(
  updates_param json[]
)
RETURNS boolean AS $$
DECLARE
  update_record json;
BEGIN
  -- Process each update
  FOR update_record IN SELECT * FROM unnest(updates_param)
  LOOP
    -- Insert transaction
    INSERT INTO transactions (
      user_id,
      type,
      points,
      description,
      task_type
    ) VALUES (
      (update_record->>'userId')::uuid,
      'earn',
      (update_record->>'points')::integer,
      update_record->>'description',
      'batch_update'
    );

    -- Update profile points
    UPDATE profiles
    SET 
      points = points + (update_record->>'points')::integer,
      total_earned = total_earned + (update_record->>'points')::integer,
      updated_at = now()
    WHERE id = (update_record->>'userId')::uuid;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring function
CREATE OR REPLACE FUNCTION get_database_performance_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'activeConnections', (
      SELECT count(*)
      FROM pg_stat_activity
      WHERE state = 'active'
    ),
    'totalConnections', (
      SELECT count(*)
      FROM pg_stat_activity
    ),
    'databaseSize', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    ),
    'cacheHitRatio', (
      SELECT round(
        100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read) + 1), 2
      )
      FROM pg_stat_database
      WHERE datname = current_database()
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date 
ON transactions(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_task_type 
ON transactions(user_id, task_type) 
WHERE task_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_date 
ON tasks(user_id, completed, completed_at DESC) 
WHERE completed = true;

-- Partial index for recent transactions (using fixed timestamp instead of now())
-- This creates a static cutoff date that can be updated periodically
DO $$
DECLARE
  cutoff_date timestamptz;
BEGIN
  -- Set cutoff to 30 days ago from when migration runs
  cutoff_date := (CURRENT_TIMESTAMP - interval '30 days');
  
  -- Create the index with a fixed timestamp
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_transactions_recent 
    ON transactions(user_id, created_at DESC) 
    WHERE created_at > %L', cutoff_date);
END $$;

-- Create materialized view for user statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats_summary AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.points,
  p.total_earned,
  COUNT(DISTINCT t.id) as total_transactions,
  COUNT(DISTINCT CASE WHEN t.type = 'earn' THEN t.id END) as earn_transactions,
  COUNT(DISTINCT CASE WHEN t.type = 'redeem' THEN t.id END) as redeem_transactions,
  COUNT(DISTINCT tk.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN tk.completed THEN tk.id END) as completed_tasks,
  MAX(t.created_at) as last_transaction_date,
  p.created_at as user_created_at
FROM profiles p
LEFT JOIN transactions t ON p.id = t.user_id
LEFT JOIN tasks tk ON p.id = tk.user_id
GROUP BY p.id, p.email, p.full_name, p.points, p.total_earned, p.created_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_summary_user_id 
ON user_stats_summary(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean old performance data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete transactions older than 1 year (except signup bonuses)
  DELETE FROM transactions
  WHERE created_at < (CURRENT_TIMESTAMP - interval '1 year')
  AND task_type != 'signup';

  -- Delete completed tasks older than 6 months
  DELETE FROM tasks
  WHERE completed = true
  AND completed_at < (CURRENT_TIMESTAMP - interval '6 months');

  -- Vacuum tables to reclaim space
  VACUUM ANALYZE transactions;
  VACUUM ANALYZE tasks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the recent transactions index periodically
CREATE OR REPLACE FUNCTION update_recent_transactions_index()
RETURNS void AS $$
BEGIN
  -- Drop the old index
  DROP INDEX IF EXISTS idx_transactions_recent;
  
  -- Create new index with updated cutoff date
  EXECUTE format('CREATE INDEX idx_transactions_recent 
    ON transactions(user_id, created_at DESC) 
    WHERE created_at > %L', (CURRENT_TIMESTAMP - interval '30 days'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create additional performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_earned ON profiles(total_earned DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_points ON transactions(points DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_points_earned ON tasks(points_earned DESC);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(lower(email));