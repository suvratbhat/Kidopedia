-- Add parent_id to kid_profiles to support multiple profiles per account
ALTER TABLE kid_profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);

-- Update RLS policies for kid_profiles
-- First, enable RLS
ALTER TABLE kid_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their kids
DROP POLICY IF EXISTS "Users can view their own kid profiles" ON kid_profiles;
CREATE POLICY "Users can view their own kid profiles"
ON kid_profiles FOR SELECT
USING (auth.uid() = parent_id);

-- Policy to allow users to insert their own kids
DROP POLICY IF EXISTS "Users can insert their own kid profiles" ON kid_profiles;
CREATE POLICY "Users can insert their own kid profiles"
ON kid_profiles FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Policy to allow users to update their own kids
DROP POLICY IF EXISTS "Users can update their own kid profiles" ON kid_profiles;
CREATE POLICY "Users can update their own kid profiles"
ON kid_profiles FOR UPDATE
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Policy to allow users to delete their own kids
DROP POLICY IF EXISTS "Users can delete their own kid profiles" ON kid_profiles;
CREATE POLICY "Users can delete their own kid profiles"
ON kid_profiles FOR DELETE
USING (auth.uid() = parent_id);

-- Update the upsert_kid_profile function to handle parent_id
CREATE OR REPLACE FUNCTION upsert_kid_profile(
  id_val TEXT,
  name_val TEXT,
  age_val INTEGER,
  gender_val TEXT,
  avatar_color_val TEXT,
  avatar_url_val TEXT DEFAULT NULL,
  current_level_val INTEGER DEFAULT 1,
  total_xp_val INTEGER DEFAULT 0,
  words_learned_val INTEGER DEFAULT 0,
  parent_id_val UUID DEFAULT auth.uid()
) RETURNS VOID AS $$
BEGIN
  INSERT INTO kid_profiles (
    id, name, age, gender, avatar_color, avatar_url, current_level, total_xp, words_learned, parent_id, updated_at
  ) VALUES (
    id_val, name_val, age_val, gender_val, avatar_color_val, avatar_url_val, current_level_val, total_xp_val, words_learned_val, parent_id_val, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    avatar_color = EXCLUDED.avatar_color,
    avatar_url = EXCLUDED.avatar_url,
    current_level = EXCLUDED.current_level,
    total_xp = EXCLUDED.total_xp,
    words_learned = EXCLUDED.words_learned,
    parent_id = COALESCE(EXCLUDED.parent_id, kid_profiles.parent_id),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
