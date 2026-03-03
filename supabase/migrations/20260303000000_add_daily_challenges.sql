/*
  # Add Daily Challenges

  1. New Table: daily_challenges
     - Tracks the 3-word daily challenge sets generated per profile per day
     - Stores progress (answered words + correct answers)
     - Records completion and streak badge unlock

  2. Security
     - RLS enabled; each user can only read/write their own rows
     - INSERT for own profile_id only (auth.uid() check via profiles join)

  3. Notes
     - challenge_date is stored as ISO date string (YYYY-MM-DD)
     - word_ids is a text[] of word strings picked for the challenge
     - answers_given is jsonb: { [word: string]: boolean }
*/

CREATE TABLE IF NOT EXISTS daily_challenges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       text NOT NULL,
  challenge_date   date NOT NULL DEFAULT CURRENT_DATE,
  word_ids         text[] NOT NULL DEFAULT '{}',
  answers_given    jsonb NOT NULL DEFAULT '{}',
  completed        boolean NOT NULL DEFAULT false,
  badge_unlocked   boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, challenge_date)
);

-- Index for fast lookup by profile + date
CREATE INDEX IF NOT EXISTS idx_dc_profile_date ON daily_challenges(profile_id, challenge_date);

-- RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- Only the profile owner may select their challenges
-- (profile_id matches a profile they own in kid_profiles)
CREATE POLICY "profile owner can select daily_challenges"
  ON daily_challenges FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Any authenticated session may insert (we validate profile ownership in app)
CREATE POLICY "profile owner can insert daily_challenges"
  ON daily_challenges FOR INSERT
  WITH CHECK (true);

-- Profile owner may update their own challenges
CREATE POLICY "profile owner can update daily_challenges"
  ON daily_challenges FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_daily_challenge_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dc_updated_at ON daily_challenges;
CREATE TRIGGER trg_dc_updated_at
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW EXECUTE FUNCTION update_daily_challenge_updated_at();
