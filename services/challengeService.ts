/**
 * challengeService — Daily Word Challenge logic.
 *
 * Fetches today's challenge from the Supabase Edge Function (online)
 * or falls back to a locally-generated challenge from SQLite (offline).
 * Progress is persisted in AsyncStorage so the kid can leave and return.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { sqliteService } from './sqliteService';
import { profileService } from './profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallengeWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  options: string[]; // 4 multiple-choice answers
  correctIndex: number;
}

export interface DailyChallenge {
  date: string;           // YYYY-MM-DD
  profileId: string;
  words: ChallengeWord[];
  answersGiven: Record<string, boolean>; // word → correct?
  completed: boolean;
  badgeUnlocked: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORDS_PER_CHALLENGE = 3;
const XP_PER_CORRECT_ANSWER = 20;
const XP_COMPLETION_BONUS = 30;
const STORAGE_KEY_PREFIX = '@kidopedia_challenge_';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function storageKey(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}${profileId}_${todayISO()}`;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function buildOptions(
  correctDef: string,
  pool: Array<{ word: string; definition: string }>,
  correctWord: string,
): { options: string[]; correctIndex: number } {
  const distractors = pool
    .filter((w) => w.word !== correctWord && w.definition !== correctDef)
    .map((w) => w.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Pad with generic fallbacks if pool is tiny
  while (distractors.length < 3) {
    distractors.push(['A type of animal', 'Something you eat', 'A place to visit'][distractors.length]);
  }

  const all = [correctDef, ...distractors].sort(() => Math.random() - 0.5);
  return { options: all, correctIndex: all.indexOf(correctDef) };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const challengeService = {
  /**
   * Fetch today's challenge for a profile.
   * 1. Check AsyncStorage cache (fastest, works mid-session)
   * 2. Fetch from Supabase Edge Function (requires network)
   * 3. Fall back to local SQLite generation (fully offline)
   */
  async getTodayChallenge(profileId: string, profileAge: number): Promise<DailyChallenge> {
    const key = storageKey(profileId);

    // ── Step 1: Local session cache ──────────────────────────────────────────
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached) as DailyChallenge;
      }
    } catch {
      // Ignore storage errors
    }

    // ── Step 2: Supabase Edge Function ───────────────────────────────────────
    try {
      const { data, error } = await supabase.functions.invoke('daily-challenge', {
        method: 'GET',
        headers: {},
        body: undefined,
        // Pass params via query string by appending to function URL
      } as Parameters<typeof supabase.functions.invoke>[1]);

      // supabase.functions.invoke doesn't support query params natively,
      // so we call the edge function URL directly via fetch.
      throw new Error('use-fetch-path'); // jump to fetch path below
    } catch {
      // Try direct fetch with query params
    }

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const edgeUrl = `${supabaseUrl}/functions/v1/daily-challenge?profileId=${encodeURIComponent(profileId)}&age=${profileAge}`;
        const res = await fetch(edgeUrl, {
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const payload = await res.json();
          const challenge: DailyChallenge = {
            date: payload.date,
            profileId: payload.profileId,
            words: payload.words,
            answersGiven: payload.answersGiven ?? {},
            completed: payload.alreadyCompleted ?? false,
            badgeUnlocked: payload.alreadyCompleted ?? false,
          };
          await AsyncStorage.setItem(key, JSON.stringify(challenge));
          return challenge;
        }
      }
    } catch {
      // Network error — fall through to local generation
    }

    // ── Step 3: Local SQLite fallback ────────────────────────────────────────
    return this._generateLocalChallenge(profileId, profileAge);
  },

  /**
   * Generate a challenge entirely from the local SQLite word cache.
   * Used when offline or the edge function is unavailable.
   */
  async _generateLocalChallenge(profileId: string, profileAge: number): Promise<DailyChallenge> {
    const allWords = await sqliteService.getPopularWords(50, profileAge);

    const pool = allWords
      .map((w) => {
        const firstDef = w.meanings[0]?.definitions[0]?.definition ?? '';
        const partOfSpeech = w.meanings[0]?.partOfSpeech ?? 'word';
        return { word: w.word, definition: firstDef, partOfSpeech };
      })
      .filter((w) => w.definition.length > 0);

    if (pool.length < WORDS_PER_CHALLENGE) {
      // Absolute fallback: use whatever words exist
      const anyWords = await sqliteService.getAllCachedWords();
      const anyPool = anyWords
        .map((w) => ({
          word: w.word,
          definition: w.meanings[0]?.definitions[0]?.definition ?? 'A common word',
          partOfSpeech: w.meanings[0]?.partOfSpeech ?? 'word',
        }))
        .filter((w) => w.definition.length > 0);

      if (anyPool.length === 0) {
        // Return an empty challenge if the DB is empty
        return {
          date: todayISO(),
          profileId,
          words: [],
          answersGiven: {},
          completed: false,
          badgeUnlocked: false,
        };
      }

      // Use what we have (may be fewer than 3)
      const selected = pickRandom(anyPool, Math.min(WORDS_PER_CHALLENGE, anyPool.length));
      return this._buildChallenge(profileId, selected, anyPool);
    }

    const selected = pickRandom(pool, WORDS_PER_CHALLENGE);
    return this._buildChallenge(profileId, selected, pool);
  },

  _buildChallenge(
    profileId: string,
    selected: Array<{ word: string; definition: string; partOfSpeech: string }>,
    pool: Array<{ word: string; definition: string; partOfSpeech: string }>,
  ): DailyChallenge {
    const words: ChallengeWord[] = selected.map((w) => {
      const { options, correctIndex } = buildOptions(w.definition, pool, w.word);
      return {
        word: w.word,
        definition: w.definition,
        partOfSpeech: w.partOfSpeech,
        options,
        correctIndex,
      };
    });

    return {
      date: todayISO(),
      profileId,
      words,
      answersGiven: {},
      completed: false,
      badgeUnlocked: false,
    };
  },

  /**
   * Record an answer for a word in the current challenge.
   * Returns updated challenge. Awards XP on correct answer.
   */
  async submitAnswer(
    challenge: DailyChallenge,
    word: string,
    selectedIndex: number,
  ): Promise<DailyChallenge> {
    const challengeWord = challenge.words.find((w) => w.word === word);
    if (!challengeWord) return challenge;

    const isCorrect = selectedIndex === challengeWord.correctIndex;

    const updatedAnswers = { ...challenge.answersGiven, [word]: isCorrect };

    // Award XP for correct answer (only if not already answered)
    const alreadyAnswered = word in challenge.answersGiven;
    if (isCorrect && !alreadyAnswered) {
      try {
        await profileService.addXP(challenge.profileId, XP_PER_CORRECT_ANSWER);
      } catch {
        // Silently ignore XP errors
      }
    }

    const answeredCount = Object.keys(updatedAnswers).length;
    const allAnswered = answeredCount >= challenge.words.length;
    const allCorrect = allAnswered && Object.values(updatedAnswers).every(Boolean);

    let badgeUnlocked = challenge.badgeUnlocked;

    // Complete the challenge once all words are answered
    if (allAnswered && !challenge.completed) {
      if (allCorrect) {
        // Perfect score: award completion bonus XP + update streak
        try {
          await profileService.addXP(challenge.profileId, XP_COMPLETION_BONUS);
          await profileService.updateDailyActivity(challenge.profileId);
        } catch {
          // Silently ignore
        }
        badgeUnlocked = true;
      }

      // Sync to Supabase (fire-and-forget)
      this._syncChallengeToSupabase({
        ...challenge,
        answersGiven: updatedAnswers,
        completed: allAnswered,
        badgeUnlocked,
      }).catch(() => {});
    }

    const updated: DailyChallenge = {
      ...challenge,
      answersGiven: updatedAnswers,
      completed: allAnswered,
      badgeUnlocked,
    };

    // Persist locally
    try {
      await AsyncStorage.setItem(storageKey(challenge.profileId), JSON.stringify(updated));
    } catch {
      // Ignore
    }

    return updated;
  },

    /** Background Supabase sync of challenge progress. */
    async _syncChallengeToSupabase(challenge: DailyChallenge): Promise<void> {
      try {
        await supabase.rpc('upsert_daily_challenge', {
          profile_id_val: challenge.profileId,
          challenge_date_val: challenge.date,
          word_ids_val: challenge.words.map((w) => w.word),
          answers_given_val: challenge.answersGiven,
          completed_val: challenge.completed,
          badge_unlocked_val: challenge.badgeUnlocked,
        });
      } catch (error) {
        console.error('Error syncing challenge to Supabase:', error);
        // Silently ignore network errors
      }
    }
  ,

  /**
   * Check if today's challenge is already complete for a profile.
   * Returns false if no challenge data found.
   */
  async isTodayComplete(profileId: string): Promise<boolean> {
    try {
      const key = storageKey(profileId);
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const challenge = JSON.parse(cached) as DailyChallenge;
        return challenge.completed;
      }
    } catch {
      // Ignore
    }
    return false;
  },

  /**
   * Clear today's cached challenge (used in testing or forcing a refresh).
   */
  async clearTodayCache(profileId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(storageKey(profileId));
    } catch {
      // Ignore
    }
  },
};
