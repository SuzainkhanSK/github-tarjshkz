-- Add referral_code to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by text;
  END IF;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 3),
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

-- Create referral_earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  original_points integer NOT NULL CHECK (original_points > 0),
  commission_percentage integer NOT NULL CHECK (commission_percentage BETWEEN 1 AND 100),
  commission_points integer NOT NULL CHECK (commission_points > 0),
  level integer NOT NULL CHECK (level BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON referrals(level);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_id ON referral_earnings(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_transaction_id ON referral_earnings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_level ON referral_earnings(level);

-- Create unique index on profiles.referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- RLS Policies for referrals
CREATE POLICY "Users can read own referrals as referrer"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can read own referrals as referred"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- RLS Policies for referral_earnings
CREATE POLICY "Users can read own referral earnings"
  ON referral_earnings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  -- Generate a unique code based on user ID and random characters
  LOOP
    -- Create a 8-character alphanumeric code
    new_code := UPPER(
      SUBSTRING(
        MD5(user_id_param::text || RANDOM()::text),
        1, 8
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE referral_code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Update user's profile with the new code
  UPDATE profiles
  SET referral_code = new_code
  WHERE id = user_id_param;
  
  RETURN new_code;
END;
$$;

-- Function to process referral when a user signs up with a referral code
CREATE OR REPLACE FUNCTION process_referral_signup(
  new_user_id uuid,
  referral_code_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id uuid;
  referrer_level_1_id uuid;
  referrer_level_2_id uuid;
BEGIN
  -- Find the direct referrer (Level 1)
  SELECT id INTO referrer_id
  FROM profiles
  WHERE referral_code = referral_code_param;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the new user's profile with referred_by
  UPDATE profiles
  SET referred_by = referral_code_param
  WHERE id = new_user_id;
  
  -- Create Level 1 referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    level,
    status
  ) VALUES (
    referrer_id,
    new_user_id,
    referral_code_param,
    1,
    'pending'
  );
  
  -- Find Level 2 referrer (the person who referred the referrer)
  SELECT p.id INTO referrer_level_1_id
  FROM profiles p
  WHERE p.referral_code = (
    SELECT referred_by FROM profiles WHERE id = referrer_id
  );
  
  -- Create Level 2 referral if exists
  IF referrer_level_1_id IS NOT NULL THEN
    INSERT INTO referrals (
      referrer_id,
      referred_id,
      referral_code,
      level,
      status
    ) VALUES (
      referrer_level_1_id,
      new_user_id,
      (SELECT referred_by FROM profiles WHERE id = referrer_id),
      2,
      'pending'
    );
    
    -- Find Level 3 referrer
    SELECT p.id INTO referrer_level_2_id
    FROM profiles p
    WHERE p.referral_code = (
      SELECT referred_by FROM profiles WHERE id = referrer_level_1_id
    );
    
    -- Create Level 3 referral if exists
    IF referrer_level_2_id IS NOT NULL THEN
      INSERT INTO referrals (
        referrer_id,
        referred_id,
        referral_code,
        level,
        status
      ) VALUES (
        referrer_level_2_id,
        new_user_id,
        (SELECT referred_by FROM profiles WHERE id = referrer_level_1_id),
        3,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to complete referral and award points when referred user completes first task
CREATE OR REPLACE FUNCTION complete_referral(
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ref record;
  level_1_points integer := 500;
  level_2_points integer := 200;
  level_3_points integer := 100;
  points_to_award integer;
  referrer_current_points integer;
  referrer_total_earned integer;
BEGIN
  -- Check if user has any pending referrals
  FOR ref IN
    SELECT * FROM referrals
    WHERE referred_id = user_id_param
    AND status = 'pending'
  LOOP
    -- Determine points based on level
    IF ref.level = 1 THEN
      points_to_award := level_1_points;
    ELSIF ref.level = 2 THEN
      points_to_award := level_2_points;
    ELSE
      points_to_award := level_3_points;
    END IF;
    
    -- Get referrer's current points
    SELECT points, total_earned
    INTO referrer_current_points, referrer_total_earned
    FROM profiles
    WHERE id = ref.referrer_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
      status = 'completed',
      points_awarded = points_to_award,
      completed_at = now()
    WHERE id = ref.id;
    
    -- Add transaction for referrer
    INSERT INTO transactions (
      user_id,
      type,
      points,
      description,
      task_type
    ) VALUES (
      ref.referrer_id,
      'earn',
      points_to_award,
      'Referral Bonus: Level ' || ref.level || ' referral completed',
      'referral_bonus'
    );
    
    -- Update referrer's points
    UPDATE profiles
    SET 
      points = referrer_current_points + points_to_award,
      total_earned = referrer_total_earned + points_to_award
    WHERE id = ref.referrer_id;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Function to calculate and award commission on earnings
CREATE OR REPLACE FUNCTION award_referral_commission(
  user_id_param uuid,
  transaction_id_param uuid,
  points_earned integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  level_1_referrer uuid;
  level_2_referrer uuid;
  level_3_referrer uuid;
  level_1_commission_pct integer := 10;
  level_2_commission_pct integer := 5;
  level_3_commission_pct integer := 2;
  level_1_commission integer;
  level_2_commission integer;
  level_3_commission integer;
  user_referral_code text;
BEGIN
  -- Only process for 'earn' type transactions
  IF NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = transaction_id_param 
    AND user_id = user_id_param
    AND type = 'earn'
  ) THEN
    RETURN false;
  END IF;
  
  -- Get user's referral information
  SELECT referred_by INTO user_referral_code
  FROM profiles
  WHERE id = user_id_param;
  
  -- If user wasn't referred, exit
  IF user_referral_code IS NULL THEN
    RETURN false;
  END IF;
  
  -- Find Level 1 referrer
  SELECT id INTO level_1_referrer
  FROM profiles
  WHERE referral_code = user_referral_code;
  
  -- If Level 1 referrer exists, award commission
  IF level_1_referrer IS NOT NULL THEN
    level_1_commission := (points_earned * level_1_commission_pct) / 100;
    
    -- Only process if commission is at least 1 point
    IF level_1_commission >= 1 THEN
      -- Record commission
      INSERT INTO referral_earnings (
        referrer_id,
        referred_id,
        transaction_id,
        original_points,
        commission_percentage,
        commission_points,
        level
      ) VALUES (
        level_1_referrer,
        user_id_param,
        transaction_id_param,
        points_earned,
        level_1_commission_pct,
        level_1_commission,
        1
      );
      
      -- Add transaction for referrer
      INSERT INTO transactions (
        user_id,
        type,
        points,
        description,
        task_type
      ) VALUES (
        level_1_referrer,
        'earn',
        level_1_commission,
        'Referral Commission: ' || level_1_commission_pct || '% of ' || points_earned || ' points (Level 1)',
        'referral_commission'
      );
      
      -- Update referrer's points
      UPDATE profiles
      SET 
        points = points + level_1_commission,
        total_earned = total_earned + level_1_commission
      WHERE id = level_1_referrer;
      
      -- Find Level 2 referrer
      SELECT referred_by INTO user_referral_code
      FROM profiles
      WHERE id = level_1_referrer;
      
      IF user_referral_code IS NOT NULL THEN
        SELECT id INTO level_2_referrer
        FROM profiles
        WHERE referral_code = user_referral_code;
        
        -- If Level 2 referrer exists, award commission
        IF level_2_referrer IS NOT NULL THEN
          level_2_commission := (points_earned * level_2_commission_pct) / 100;
          
          -- Only process if commission is at least 1 point
          IF level_2_commission >= 1 THEN
            -- Record commission
            INSERT INTO referral_earnings (
              referrer_id,
              referred_id,
              transaction_id,
              original_points,
              commission_percentage,
              commission_points,
              level
            ) VALUES (
              level_2_referrer,
              user_id_param,
              transaction_id_param,
              points_earned,
              level_2_commission_pct,
              level_2_commission,
              2
            );
            
            -- Add transaction for referrer
            INSERT INTO transactions (
              user_id,
              type,
              points,
              description,
              task_type
            ) VALUES (
              level_2_referrer,
              'earn',
              level_2_commission,
              'Referral Commission: ' || level_2_commission_pct || '% of ' || points_earned || ' points (Level 2)',
              'referral_commission'
            );
            
            -- Update referrer's points
            UPDATE profiles
            SET 
              points = points + level_2_commission,
              total_earned = total_earned + level_2_commission
            WHERE id = level_2_referrer;
            
            -- Find Level 3 referrer
            SELECT referred_by INTO user_referral_code
            FROM profiles
            WHERE id = level_2_referrer;
            
            IF user_referral_code IS NOT NULL THEN
              SELECT id INTO level_3_referrer
              FROM profiles
              WHERE referral_code = user_referral_code;
              
              -- If Level 3 referrer exists, award commission
              IF level_3_referrer IS NOT NULL THEN
                level_3_commission := (points_earned * level_3_commission_pct) / 100;
                
                -- Only process if commission is at least 1 point
                IF level_3_commission >= 1 THEN
                  -- Record commission
                  INSERT INTO referral_earnings (
                    referrer_id,
                    referred_id,
                    transaction_id,
                    original_points,
                    commission_percentage,
                    commission_points,
                    level
                  ) VALUES (
                    level_3_referrer,
                    user_id_param,
                    transaction_id_param,
                    points_earned,
                    level_3_commission_pct,
                    level_3_commission,
                    3
                  );
                  
                  -- Add transaction for referrer
                  INSERT INTO transactions (
                    user_id,
                    type,
                    points,
                    description,
                    task_type
                  ) VALUES (
                    level_3_referrer,
                    'earn',
                    level_3_commission,
                    'Referral Commission: ' || level_3_commission_pct || '% of ' || points_earned || ' points (Level 3)',
                    'referral_commission'
                  );
                  
                  -- Update referrer's points
                  UPDATE profiles
                  SET 
                    points = points + level_3_commission,
                    total_earned = total_earned + level_3_commission
                  WHERE id = level_3_referrer;
                END IF;
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Create trigger to award commission on new transactions
CREATE OR REPLACE FUNCTION process_transaction_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process for 'earn' type transactions
  IF NEW.type = 'earn' THEN
    PERFORM award_referral_commission(NEW.user_id, NEW.id, NEW.points);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS transaction_commission_trigger ON transactions;
CREATE TRIGGER transaction_commission_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_transaction_commission();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_referral_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_signup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_referral(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION award_referral_commission(uuid, uuid, integer) TO authenticated;