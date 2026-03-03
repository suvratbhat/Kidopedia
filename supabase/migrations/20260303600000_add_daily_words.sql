/*
  |--------------------------------------------------------------------------
  | Add Daily Words Table
  |--------------------------------------------------------------------------
  |
  | Stores the global "Word of the Day" for different complexity levels.
  | This allows the app to surface the same word to all kids in the same
  | difficulty tier on any given day.
  |
*/

CREATE TABLE IF NOT EXISTS public.daily_words (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    word_id uuid REFERENCES public.cached_words(id) ON DELETE CASCADE,
    complexity_level integer NOT NULL,
    display_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(complexity_level, display_date)
);

-- Index for fast lookup by date and level
CREATE INDEX IF NOT EXISTS idx_daily_words_date_level ON public.daily_words(display_date, complexity_level);

-- Enable RLS
ALTER TABLE public.daily_words ENABLE ROW LEVEL SECURITY;

-- Everyone can read daily words
CREATE POLICY "Everyone can read daily words"
    ON public.daily_words
    FOR SELECT
    TO public
    USING (true);

-- Only service role or authorized functions should insert (handled by SECURITY DEFINER if needed, 
-- but here we'll assume the Edge Function uses service role)
