/*
  # Payment System Tables

  1. New Tables
    - `payment_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `transaction_id` (text, unique)
      - `points` (integer)
      - `amount` (integer)
      - `status` (text: pending, completed, rejected)
      - `payment_screenshot` (text, URL to screenshot)
      - `payment_method` (text)
      - `utr_number` (text)
      - `contact_info` (text)
      - `notes` (text, optional)
      - `admin_notes` (text, optional)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)

  2. Security
    - Enable RLS on payment_transactions table
    - Add policies for authenticated users to manage their own transactions
    - Add policies for admins to manage all transactions

  3. Functions
    - Process payment verification
    - Award points on payment completion
*/

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id text NOT NULL UNIQUE,
  points integer NOT NULL CHECK (points > 0),
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
  payment_screenshot text,
  payment_method text NOT NULL,
  utr_number text NOT NULL,
  contact_info text NOT NULL,
  notes text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment screenshots
CREATE POLICY "Users can upload their own payment screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own payment screenshots"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can read own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin policies for payment_transactions
CREATE POLICY "Admins can read all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Function to verify payment and award points
CREATE OR REPLACE FUNCTION verify_payment_transaction(
  transaction_id_param text,
  status_param text,
  admin_notes_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_record payment_transactions%ROWTYPE;
  user_points integer;
  user_total_earned integer;
BEGIN
  -- Check if admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can verify payments';
  END IF;

  -- Get transaction
  SELECT * INTO transaction_record
  FROM payment_transactions
  WHERE transaction_id = transaction_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  -- Check if already processed
  IF transaction_record.status != 'pending' THEN
    RAISE EXCEPTION 'Transaction already processed';
  END IF;
  
  -- Update transaction status
  UPDATE payment_transactions
  SET 
    status = status_param,
    admin_notes = admin_notes_param,
    completed_at = now()
  WHERE transaction_id = transaction_id_param;
  
  -- If approved, add points to user
  IF status_param = 'completed' THEN
    -- Get current user points
    SELECT points, total_earned INTO user_points, user_total_earned
    FROM profiles
    WHERE id = transaction_record.user_id;
    
    -- Update user profile
    UPDATE profiles
    SET 
      points = user_points + transaction_record.points,
      total_earned = user_total_earned + transaction_record.points
    WHERE id = transaction_record.user_id;
    
    -- Add transaction record
    INSERT INTO transactions (
      user_id,
      type,
      points,
      description,
      task_type
    ) VALUES (
      transaction_record.user_id,
      'earn',
      transaction_record.points,
      'Points Purchase: ' || transaction_record.points || ' points for ₹' || transaction_record.amount,
      'purchase'
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_payment_transaction(text, text, text) TO authenticated;