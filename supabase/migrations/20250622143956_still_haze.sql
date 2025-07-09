/*
  # Add user details to redemption requests

  1. Changes
    - Add `user_email` column to store user's email for redemption
    - Add `user_country` column to store user's country for regional processing
    - Add `user_notes` column to store optional user notes/instructions
  
  2. Security
    - No RLS changes needed as existing policies cover these columns
*/

DO $$
BEGIN
  -- Add user_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'redemption_requests' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE redemption_requests ADD COLUMN user_email text NOT NULL DEFAULT '';
  END IF;

  -- Add user_country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'redemption_requests' AND column_name = 'user_country'
  ) THEN
    ALTER TABLE redemption_requests ADD COLUMN user_country text NOT NULL DEFAULT '';
  END IF;

  -- Add user_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'redemption_requests' AND column_name = 'user_notes'
  ) THEN
    ALTER TABLE redemption_requests ADD COLUMN user_notes text;
  END IF;
END $$;