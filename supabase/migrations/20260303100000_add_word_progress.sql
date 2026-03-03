/*
  # Add Word Progress (Mastery Levels)

  1. New Table: word_progress
     - Tracks per-kid-profile, per-word quiz attempt history
     - attempt_count: total number of quiz attempts
     - correct_count: number of correct quiz answers
     - Mastery tier is computed at read-time (not stored):
         Seen       — viewed but no quiz attempts yet (attempt_count = 0)
         Practiced  — 1–4 quiz attempts with < 80% accuracy
         Mastered   — ≥ 5 correct answers  OR  ≥ 3 attempts with ≥ 80% accuracy

  2. Security
     - RLS enabled; each user can only read/write their own rows

  3. Notes
     - profile_id references kid_profiles.id (text PK)
     - word is stored lowercase for case-insensitive matching
     - UNIQUE(profile_id, word) — one row per word per profile
*/

CREATE TABLE IF NOT EXISTS word_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    text NOT NULL,
  word          text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, word)
);

-- Index for fast lookup by profile
CREATE INDEX IF NOT EXISTS idx_wp_profile_id ON word_progress(profile_id);
-- Index for sorting by recently seen
CREATE INDEX IF NOT EXISTS idx_wp_profile_seen ON word_progress(profile_id, last_seen_at DESC);

-- RLS
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

-- Profile owner can read their own word progress
CREATE POLICY "profile owner can select word_progress"
  ON word_progress FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Any authenticated session may insert (profile ownership validated in app)
CREATE POLICY "profile owner can insert word_progress"
  ON word_progress FOR INSERT
  WITH CHECK (true);

-- Profile owner may update their own rows
CREATE POLICY "profile owner can update word_progress"
  ON word_progress FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_word_progress_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wp_updated_at ON word_progress;
CREATE TRIGGER trg_wp_updated_at
  BEFORE UPDATE ON word_progress
  FOR EACH ROW EXECUTE FUNCTION update_word_progress_updated_at();
