-- Ensure cached_words table exists and has all required columns
-- Also adds RPCs for search count and upserting with security definer

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.cached_words (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    word text UNIQUE NOT NULL,
    phonetic text,
    audio_url text,
    meanings jsonb DEFAULT '[]'::jsonb,
    origin text,
    kannada_translation text,
    hindi_translation text,
    is_age_appropriate boolean DEFAULT true,
    min_age integer DEFAULT 2,
    content_flags text[] DEFAULT '{}',
    complexity_level integer DEFAULT 5,
    search_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Ensure all columns exist (in case table was created partially elsewhere)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cached_words' AND column_name = 'audio_url') THEN
        ALTER TABLE public.cached_words ADD COLUMN audio_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cached_words' AND column_name = 'kannada_translation') THEN
        ALTER TABLE public.cached_words ADD COLUMN kannada_translation text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cached_words' AND column_name = 'hindi_translation') THEN
        ALTER TABLE public.cached_words ADD COLUMN hindi_translation text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cached_words' AND column_name = 'search_count') THEN
        ALTER TABLE public.cached_words ADD COLUMN search_count integer DEFAULT 0;
    END IF;

    -- Ensure kid_profiles has updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kid_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.kid_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.cached_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Public READ policy
CREATE POLICY "Public can read cached words"
    ON public.cached_words
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Public can read profiles"
    ON public.kid_profiles
    FOR SELECT
    TO public
    USING (true);

-- 5. RPC for incrementing search count (Security Definer to bypass RLS for updates)
CREATE OR REPLACE FUNCTION public.increment_word_search_count(word_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.cached_words
    SET search_count = search_count + 1,
        updated_at = now()
    WHERE word = lower(word_text);
END;
$$;

-- 6. RPC for upserting cached words (Security Definer to allow public to contribute to cache safely)
CREATE OR REPLACE FUNCTION public.upsert_cached_word(
    word_val text,
    phonetic_val text,
    audio_url_val text,
    meanings_val jsonb,
    origin_val text,
    kannada_val text,
    hindi_val text,
    is_age_appropriate_val boolean,
    min_age_val integer,
    content_flags_val text[],
    complexity_level_val integer
)
RETURNS public.cached_words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.cached_words;
BEGIN
    INSERT INTO public.cached_words (
        word, phonetic, audio_url, meanings, origin, 
        kannada_translation, hindi_translation, 
        is_age_appropriate, min_age, content_flags, complexity_level,
        updated_at
    )
    VALUES (
        lower(word_val), phonetic_val, audio_url_val, meanings_val, origin_val,
        kannada_val, hindi_val,
        is_age_appropriate_val, min_age_val, content_flags_val, complexity_level_val,
        now()
    )
    ON CONFLICT (word) DO UPDATE
    SET 
        phonetic = EXCLUDED.phonetic,
        audio_url = COALESCE(EXCLUDED.audio_url, cached_words.audio_url),
        meanings = EXCLUDED.meanings,
        origin = EXCLUDED.origin,
        kannada_translation = COALESCE(EXCLUDED.kannada_translation, cached_words.kannada_translation),
        hindi_translation = COALESCE(EXCLUDED.hindi_translation, cached_words.hindi_translation),
        is_age_appropriate = EXCLUDED.is_age_appropriate,
        min_age = EXCLUDED.min_age,
        content_flags = EXCLUDED.content_flags,
        complexity_level = EXCLUDED.complexity_level,
        updated_at = now()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- 7. RPC for updating just the audio URL (Security Definer)
CREATE OR REPLACE FUNCTION public.update_word_audio_url(
    word_val text,
    audio_url_val text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.cached_words
    SET audio_url = audio_url_val,
        updated_at = now()
    WHERE word = lower(word_val);
END;
$$;

-- 8. RPC for upserting kid profiles (Security Definer)
CREATE OR REPLACE FUNCTION public.upsert_kid_profile(
    id_val text,
    name_val text,
    age_val integer,
    gender_val text,
    avatar_color_val text,
    avatar_url_val text,
    current_level_val integer,
    total_xp_val integer,
    words_learned_val integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.kid_profiles (
        id, name, age, gender, avatar_color, avatar_url, 
        current_level, total_xp, words_learned, updated_at
    )
    VALUES (
        id_val, name_val, age_val, gender_val, avatar_color_val, avatar_url_val,
        current_level_val, total_xp_val, words_learned_val, now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        avatar_color = EXCLUDED.avatar_color,
        avatar_url = COALESCE(EXCLUDED.avatar_url, kid_profiles.avatar_url),
        current_level = EXCLUDED.current_level,
        total_xp = EXCLUDED.total_xp,
        words_learned = EXCLUDED.words_learned,
        updated_at = now();
END;
$$;

-- 9. RPC for upserting word progress (Security Definer)
CREATE OR REPLACE FUNCTION public.upsert_word_progress(
    profile_id_val text,
    word_val text,
    attempt_count_val integer,
    correct_count_val integer,
    last_seen_at_val timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.word_progress (
        profile_id, word, attempt_count, correct_count, last_seen_at, updated_at
    )
    VALUES (
        profile_id_val, lower(word_val), attempt_count_val, correct_count_val, last_seen_at_val, now()
    )
    ON CONFLICT (profile_id, word) DO UPDATE
    SET 
        attempt_count = EXCLUDED.attempt_count,
        correct_count = EXCLUDED.correct_count,
        last_seen_at = EXCLUDED.last_seen_at,
        updated_at = now();
END;
$$;

-- 10. RPC for upserting daily challenges (Security Definer)
CREATE OR REPLACE FUNCTION public.upsert_daily_challenge(
    profile_id_val text,
    challenge_date_val date,
    word_ids_val text[],
    answers_given_val jsonb,
    completed_val boolean,
    badge_unlocked_val boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.daily_challenges (
        profile_id, challenge_date, word_ids, answers_given, completed, badge_unlocked, updated_at
    )
    VALUES (
        profile_id_val, challenge_date_val, word_ids_val, answers_given_val, completed_val, badge_unlocked_val, now()
    )
    ON CONFLICT (profile_id, challenge_date) DO UPDATE
    SET 
        word_ids = EXCLUDED.word_ids,
        answers_given = EXCLUDED.answers_given,
        completed = EXCLUDED.completed,
        badge_unlocked = EXCLUDED.badge_unlocked,
        updated_at = now();
END;
$$;
