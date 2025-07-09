/*
  # Trivia Quiz Game Tables

  1. New Tables
    - `quiz_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `score` (integer)
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `time_taken` (integer, seconds)
      - `category` (text)
      - `difficulty` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quiz_history` table
    - Add policies for authenticated users to read/insert their own data

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create quiz_history table
CREATE TABLE IF NOT EXISTS quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0),
  time_taken integer NOT NULL CHECK (time_taken >= 0),
  category text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own quiz history"
  ON quiz_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz history"
  ON quiz_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_created_at ON quiz_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_history_score ON quiz_history(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_date ON quiz_history(user_id, created_at DESC);

-- Create function to check daily quiz limit
CREATE OR REPLACE FUNCTION check_daily_quiz_limit(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quizzes_today integer;
BEGIN
  -- Count quizzes for today
  SELECT COUNT(*)
  INTO quizzes_today
  FROM quiz_history
  WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  -- Return remaining quizzes (max 3 per day)
  RETURN GREATEST(0, 3 - quizzes_today);
END;
$$;

-- Create function to process quiz completion
CREATE OR REPLACE FUNCTION process_quiz_completion(
  user_id_param uuid,
  score_param integer,
  total_questions_param integer,
  correct_answers_param integer,
  time_taken_param integer,
  category_param text,
  difficulty_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quizzes_remaining integer;
  current_points integer;
  current_total_earned integer;
  quiz_id uuid;
BEGIN
  -- Check if user has quizzes remaining today
  SELECT check_daily_quiz_limit(user_id_param) INTO quizzes_remaining;
  
  IF quizzes_remaining <= 0 THEN
    RAISE EXCEPTION 'No quizzes remaining today';
  END IF;
  
  -- Get current user points
  SELECT points, total_earned
  INTO current_points, current_total_earned
  FROM profiles
  WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Insert quiz history
  INSERT INTO quiz_history (
    user_id,
    score,
    total_questions,
    correct_answers,
    time_taken,
    category,
    difficulty
  ) VALUES (
    user_id_param,
    score_param,
    total_questions_param,
    correct_answers_param,
    time_taken_param,
    category_param,
    difficulty_param
  )
  RETURNING id INTO quiz_id;
  
  -- Insert transaction
  INSERT INTO transactions (
    user_id,
    type,
    points,
    description,
    task_type
  ) VALUES (
    user_id_param,
    'earn',
    score_param,
    'Trivia Quiz: ' || score_param || ' points (' || category_param || ', ' || difficulty_param || ')',
    'trivia_quiz'
  );
  
  -- Update user profile
  UPDATE profiles
  SET 
    points = current_points + score_param,
    total_earned = current_total_earned + score_param,
    updated_at = now()
  WHERE id = user_id_param;
  
  RETURN quiz_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_daily_quiz_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_quiz_completion(uuid, integer, integer, integer, integer, text, text) TO authenticated;