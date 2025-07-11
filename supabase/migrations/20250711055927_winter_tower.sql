/*
  # Fix Redemption Management

  1. New Functions
    - `get_all_redemption_requests` - Security definer function to get all redemption requests
    - `update_redemption_request` - Security definer function to update redemption requests

  2. Security
    - Add security definer functions to bypass RLS for admin operations
    - Ensure only admin users can access these functions
*/

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin_for_redemptions(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Create a function to get all redemption requests
CREATE OR REPLACE FUNCTION get_all_redemption_requests()
RETURNS SETOF redemption_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_for_redemptions(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can view all redemption requests';
  END IF;

  RETURN QUERY
  SELECT * FROM redemption_requests
  ORDER BY created_at DESC;
END;
$$;

-- Create a function to update a redemption request
CREATE OR REPLACE FUNCTION update_redemption_request(
  request_id uuid,
  new_status text,
  activation_code text DEFAULT NULL,
  instructions text DEFAULT NULL
)
RETURNS redemption_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result redemption_requests;
  completed_timestamp timestamptz;
  expiry_timestamp timestamptz;
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_for_redemptions(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admin users can update redemption requests';
  END IF;

  -- Set timestamps based on status
  IF new_status IN ('completed', 'failed', 'cancelled') THEN
    completed_timestamp := now();
  ELSE
    completed_timestamp := NULL;
  END IF;

  -- Set expiry date for completed requests with activation code
  IF new_status = 'completed' AND activation_code IS NOT NULL THEN
    expiry_timestamp := now() + interval '30 days';
  ELSE
    expiry_timestamp := NULL;
  END IF;

  -- Update the redemption request
  UPDATE redemption_requests
  SET 
    status = new_status,
    activation_code = COALESCE(update_redemption_request.activation_code, redemption_requests.activation_code),
    instructions = COALESCE(update_redemption_request.instructions, redemption_requests.instructions),
    completed_at = completed_timestamp,
    expires_at = CASE WHEN new_status = 'completed' AND activation_code IS NOT NULL THEN expiry_timestamp ELSE redemption_requests.expires_at END
  WHERE id = request_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;