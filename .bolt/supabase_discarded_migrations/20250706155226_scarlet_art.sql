/*
  # Update Subscription Availability Data

  1. Updates
    - Add more subscription options to the subscription_availability table
    - Ensure all popular subscription services are available
    - Set default in_stock status to true for all subscriptions

  2. Security
    - No changes to existing security policies
    - Maintains existing RLS setup
*/

-- Insert or update subscription availability data
INSERT INTO subscription_availability (subscription_id, duration, in_stock)
VALUES
  -- YouTube Premium
  ('youtube_premium', '1 Month', true),
  ('youtube_premium', '2 Months', true),
  ('youtube_premium', '3 Months', true),
  ('youtube_premium', '6 Months', true),
  ('youtube_premium', '1 Year', true),
  
  -- Netflix
  ('netflix', '1 Month', true),
  ('netflix', '2 Months', true),
  ('netflix', '3 Months', true),
  ('netflix', '6 Months', true),
  ('netflix', '1 Year', true),
  
  -- Amazon Prime
  ('amazon_prime', '1 Month', true),
  ('amazon_prime', '3 Months', true),
  ('amazon_prime', '6 Months', true),
  ('amazon_prime', '1 Year', true),
  
  -- Spotify Premium
  ('spotify_premium', '1 Month', true),
  ('spotify_premium', '2 Months', true),
  ('spotify_premium', '3 Months', true),
  ('spotify_premium', '6 Months', true),
  ('spotify_premium', '1 Year', true),
  
  -- Disney+ Hotstar
  ('disney_hotstar', '1 Month', true),
  ('disney_hotstar', '3 Months', true),
  ('disney_hotstar', '6 Months', true),
  ('disney_hotstar', '1 Year', true),
  
  -- JioSaavn Pro
  ('jiosaavn_pro', '1 Month', true),
  ('jiosaavn_pro', '3 Months', true),
  ('jiosaavn_pro', '6 Months', true),
  ('jiosaavn_pro', '1 Year', true),
  
  -- Apple Music
  ('apple_music', '1 Month', true),
  ('apple_music', '3 Months', true),
  ('apple_music', '6 Months', true),
  ('apple_music', '1 Year', true),
  
  -- Sony LIV
  ('sony_liv', '1 Month', true),
  ('sony_liv', '3 Months', true),
  ('sony_liv', '6 Months', true),
  ('sony_liv', '1 Year', true),
  
  -- Telegram Premium
  ('telegram_premium', '1 Month', true),
  ('telegram_premium', '3 Months', true),
  ('telegram_premium', '6 Months', true),
  ('telegram_premium', '1 Year', true)
ON CONFLICT (subscription_id, duration) DO UPDATE
SET in_stock = true, updated_at = now();