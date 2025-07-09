/*
  # Remove Payment-Related Tables and Functions

  This migration safely removes payment-related tables and functions
  by first checking if they exist before attempting to drop them.
*/

-- Safely drop payment-related tables if they exist
DO $$
BEGIN
  -- Drop payment_transactions table if it exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions') THEN
    DROP TABLE public.payment_transactions CASCADE;
  END IF;

  -- Drop stripe tables if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_customers') THEN
    DROP TABLE public.stripe_customers CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_subscriptions') THEN
    DROP TABLE public.stripe_subscriptions CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_orders') THEN
    DROP TABLE public.stripe_orders CASCADE;
  END IF;
END $$;

-- Safely drop views if they exist
DO $$
BEGIN
  -- Drop stripe views if they exist
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'stripe_user_subscriptions') THEN
    DROP VIEW public.stripe_user_subscriptions CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'stripe_user_orders') THEN
    DROP VIEW public.stripe_user_orders CASCADE;
  END IF;
END $$;

-- Safely drop types if they exist
DO $$
BEGIN
  -- Drop custom types if they exist
  IF EXISTS (SELECT FROM pg_type WHERE typname = 'stripe_subscription_status') THEN
    DROP TYPE IF EXISTS public.stripe_subscription_status CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_type WHERE typname = 'stripe_order_status') THEN
    DROP TYPE IF EXISTS public.stripe_order_status CASCADE;
  END IF;
END $$;

-- Safely drop functions if they exist
DO $$
BEGIN
  -- Drop payment verification functions if they exist
  DROP FUNCTION IF EXISTS public.verify_payment_transaction(text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.simple_verify_payment(text, text, text) CASCADE;
END $$;

-- Safely drop storage objects and buckets
DO $$
BEGIN
  -- Try to delete storage objects and bucket if they exist
  -- This is wrapped in a block to catch errors if storage schema doesn't exist
  BEGIN
    DELETE FROM storage.objects WHERE bucket_id = 'payment-screenshots';
    DELETE FROM storage.buckets WHERE id = 'payment-screenshots';
  EXCEPTION
    WHEN undefined_table THEN
      -- Storage schema might not exist, ignore
    WHEN undefined_column THEN
      -- Columns might not exist, ignore
    WHEN OTHERS THEN
      -- Log other errors but continue
      RAISE NOTICE 'Error removing storage objects: %', SQLERRM;
  END;
END $$;

-- Recreate admin check functions to avoid recursion issues
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND is_active = true
  );
EXCEPTION
  WHEN undefined_table THEN
    -- admin_users table might not exist yet
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND role = 'super_admin'
    AND is_active = true
  );
EXCEPTION
  WHEN undefined_table THEN
    -- admin_users table might not exist yet
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;