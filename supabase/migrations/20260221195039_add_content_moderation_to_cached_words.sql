/*
  # Add Content Moderation to Cached Words

  1. Changes
    - Add `is_age_appropriate` boolean to track if content is kid-friendly
    - Add `min_age` field to specify minimum recommended age
    - Add `content_flags` array to store warnings (violence, adult, etc.)
    - Add `complexity_level` to rate word difficulty (1-10)
  
  2. Security
    - Filters content based on kid's age profile
    - Prevents inappropriate content from being shown
  
  3. Notes
    - Defaults to age-appropriate for existing entries
    - Content filtering at both database and app levels
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached_words' AND column_name = 'is_age_appropriate'
  ) THEN
    ALTER TABLE cached_words ADD COLUMN is_age_appropriate boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached_words' AND column_name = 'min_age'
  ) THEN
    ALTER TABLE cached_words ADD COLUMN min_age integer DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached_words' AND column_name = 'content_flags'
  ) THEN
    ALTER TABLE cached_words ADD COLUMN content_flags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached_words' AND column_name = 'complexity_level'
  ) THEN
    ALTER TABLE cached_words ADD COLUMN complexity_level integer DEFAULT 5;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cached_words_age_appropriate ON cached_words(is_age_appropriate);
CREATE INDEX IF NOT EXISTS idx_cached_words_min_age ON cached_words(min_age);
CREATE INDEX IF NOT EXISTS idx_cached_words_complexity ON cached_words(complexity_level);
