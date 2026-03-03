-- Create custom_words table
CREATE TABLE IF NOT EXISTS custom_words (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    text NOT NULL,
  word          text NOT NULL,
  definition    text NOT NULL,
  example       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, word)
);

-- Index for fast lookup by profile
CREATE INDEX IF NOT EXISTS idx_cw_profile_id ON custom_words(profile_id);

-- RLS
ALTER TABLE custom_words ENABLE ROW LEVEL SECURITY;

-- Profile owner can read their own custom words
CREATE POLICY "profile owner can select custom_words"
  ON custom_words FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Profile owner can insert custom_words
CREATE POLICY "profile owner can insert custom_words"
  ON custom_words FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Profile owner can update custom_words
CREATE POLICY "profile owner can update custom_words"
  ON custom_words FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Profile owner can delete custom_words
CREATE POLICY "profile owner can delete custom_words"
  ON custom_words FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM kid_profiles WHERE id = profile_id
    )
  );

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_custom_words_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cw_updated_at ON custom_words;
CREATE TRIGGER trg_cw_updated_at
  BEFORE UPDATE ON custom_words
  FOR EACH ROW EXECUTE FUNCTION update_custom_words_updated_at();
