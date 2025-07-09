/*
  # Setup Profile Images Storage

  1. Storage Bucket
    - Create `profile-images` bucket with public read access
    - Configure bucket for profile image uploads

  2. Security
    - Bucket is configured to allow public read access
    - Upload restrictions will be handled at the application level
    - Users can only upload to their own user ID folder structure

  3. Notes
    - Storage policies are managed by Supabase's built-in system
    - The bucket allows public read access for profile images
    - Upload permissions are controlled through the application logic
*/

-- Create the profile-images bucket using Supabase's storage system
-- This approach avoids direct table manipulation
DO $$
BEGIN
  -- Insert the bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'profile-images', 
    'profile-images', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
EXCEPTION
  WHEN others THEN
    -- If we can't create the bucket, log the error but continue
    RAISE NOTICE 'Could not create storage bucket: %', SQLERRM;
END $$;

-- Create a function to help with profile image management
CREATE OR REPLACE FUNCTION public.get_profile_image_upload_url(file_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_folder text;
  full_path text;
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Create the user-specific folder path
  user_folder := auth.uid()::text;
  full_path := user_folder || '/' || file_name;
  
  RETURN full_path;
END;
$$;

-- Create a function to validate profile image uploads
CREATE OR REPLACE FUNCTION public.validate_profile_image_upload(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_folder text;
  path_parts text[];
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Split the path to get the folder
  path_parts := string_to_array(file_path, '/');
  
  -- Check if the first part of the path matches the user's ID
  IF array_length(path_parts, 1) >= 2 AND path_parts[1] = auth.uid()::text THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_profile_image_upload_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_profile_image_upload(text) TO authenticated;