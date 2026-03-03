-- Add audio_url to cached_words if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached_words' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE cached_words ADD COLUMN audio_url text;
  END IF;
END $$;
