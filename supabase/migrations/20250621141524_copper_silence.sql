/*
  # Create profile image storage and user account deletion function

  1. Storage
    - Create profile-images bucket for user profile pictures
    - Set up RLS policies for secure image access

  2. Functions
    - Create delete_user_account function for secure account deletion
    - Handles cascading deletion of user data

  3. Security
    - Users can only upload/view their own profile images
    - Account deletion requires proper authentication
*/

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile images
CREATE POLICY "Users can upload their own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own profile images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add profile_image column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image text;
  END IF;
END $$;

-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is the account owner
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Delete user's profile images from storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-images' 
  AND name LIKE user_id_param::text || '/%';

  -- Delete user's tasks
  DELETE FROM tasks WHERE user_id = user_id_param;

  -- Delete user's transactions
  DELETE FROM transactions WHERE user_id = user_id_param;

  -- Delete user's profile
  DELETE FROM profiles WHERE id = user_id_param;

  -- Delete the auth user (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = user_id_param;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;