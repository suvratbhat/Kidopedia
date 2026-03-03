-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL,
  icon          text NOT NULL, -- Emoji or icon name
  category      text NOT NULL, -- e.g., 'words', 'streak', 'packs'
  unlock_condition jsonb NOT NULL, -- Logic description
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Create kid_badges table (junction)
CREATE TABLE IF NOT EXISTS kid_badges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    text NOT NULL, -- references kid_profiles(id)
  badge_id      uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, badge_id)
);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kid_badges ENABLE ROW LEVEL SECURITY;

-- Badges are readable by all authenticated users
CREATE POLICY "anyone can select badges"
  ON badges FOR SELECT
  USING (true);

-- Only profile owners can see their badges
CREATE POLICY "profile owner can select kid_badges"
  ON kid_badges FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Seed initial badges
INSERT INTO badges (code, title, description, icon, category, unlock_condition) VALUES
('first_10_words', 'First 10 Words', 'You learned your first 10 words!', '📚', 'words', '{"type": "words_learned", "count": 10}'),
('streak_7_day', '7-Day Streak', 'You learned words for 7 days in a row!', '🔥', 'streak', '{"type": "streak", "days": 7}'),
('space_pack_complete', 'Space Explorer', 'You completed the Space Pack!', '🚀', 'packs', '{"type": "pack_completion", "pack": "space"}')
ON CONFLICT (code) DO NOTHING;
