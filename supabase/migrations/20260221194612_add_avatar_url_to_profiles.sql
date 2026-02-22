/*
  # Add Avatar URL to Kid Profiles

  1. Changes
    - Add `avatar_url` column to `kid_profiles` table to store generated avatar URLs
    - This allows each profile to have a unique avatar based on their gender
    - The URL will point to a DiceBear avatar generation service
  
  2. Notes
    - Column is nullable to maintain backward compatibility
    - Existing profiles will generate avatars on-the-fly in the app
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kid_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE kid_profiles ADD COLUMN avatar_url text;
  END IF;
END $$;
