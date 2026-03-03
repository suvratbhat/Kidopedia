/**
 * masteryService — Word Mastery Level tracking.
 *
 * Mastery tiers:
 *   Seen       — word has been viewed (times_viewed ≥ 1) but no quiz attempts
 *   Practiced  — some quiz attempts but hasn't met Mastered criteria yet
 *   Mastered   — ≥ 5 correct answers, OR (≥ 3 attempts AND accuracy ≥ 80%)
 *
 * Attempt data is written via recordQuizResult() after each quiz answer.
 * All reads/writes hit SQLite first; Supabase is a best-effort cloud backup.
 */
import { supabase } from '@/lib/supabase';
import { sqliteService } from './sqliteService';
import { profileService } from './profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasteryTier = 'seen' | 'practiced' | 'mastered';

export interface WordMastery {
  word: string;
  tier: MasteryTier;
  attemptCount: number;
  correctCount: number;
  accuracy: number; // 0–1
  timesViewed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum correct answers to reach Mastered regardless of accuracy */
const MASTERED_MIN_CORRECT = 5;
/** Minimum attempts required for accuracy-based mastery */
const MASTERED_MIN_ATTEMPTS = 3;
/** Accuracy threshold (0–1) for accuracy-based mastery */
const MASTERED_ACCURACY_THRESHOLD = 0.8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute mastery tier from raw attempt counts and view count.
 * Pure function — safe to test without any I/O.
 */
export function computeTier(
  timesViewed: number,
  attemptCount: number,
  correctCount: number,
): MasteryTier {
  if (attemptCount === 0) {
    // Word has been seen (or will be on first view) but never quizzed
    return timesViewed > 0 ? 'seen' : 'seen';
  }

  const accuracy = attemptCount > 0 ? correctCount / attemptCount : 0;

  const mastered =
    correctCount >= MASTERED_MIN_CORRECT ||
    (attemptCount >= MASTERED_MIN_ATTEMPTS && accuracy >= MASTERED_ACCURACY_THRESHOLD);

  return mastered ? 'mastered' : 'practiced';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const masteryService = {
  /**
   * Record a single quiz result for a word.
   * Creates a row if none exists; otherwise increments attempt / correct counts.
   * Silently syncs to Supabase in the background.
   */
  async recordQuizResult(
    profileId: string,
    word: string,
    correct: boolean,
  ): Promise<void> {
    const wordLower = word.toLowerCase();

    // Ensure word_progress row exists (views are tracked separately by profileService)
    await sqliteService.upsertWordProgressAttempt(profileId, wordLower, correct);

    // Background sync to Supabase (fire-and-forget)
    _syncAttemptToSupabase(profileId, wordLower, correct);
  },

  /**
   * Get the current mastery tier for a single word.
   * Returns 'seen' if the word has never been viewed or quizzed.
   */
  async getWordMastery(profileId: string, word: string): Promise<WordMastery> {
    const wordLower = word.toLowerCase();
    const progress = await sqliteService.getSingleWordProgress(profileId, wordLower);

    const timesViewed = progress?.times_viewed ?? 0;
    const attemptCount = progress?.attempt_count ?? 0;
    const correctCount = progress?.correct_count ?? 0;
    const accuracy = attemptCount > 0 ? correctCount / attemptCount : 0;
    const tier = computeTier(timesViewed, attemptCount, correctCount);

    return { word: wordLower, tier, attemptCount, correctCount, accuracy, timesViewed };
  },

  /**
   * Get mastery for all words a profile has interacted with.
   */
  async getAllWordMastery(profileId: string): Promise<WordMastery[]> {
    const allProgress = await profileService.getWordProgress(profileId);
    return allProgress.map((p) => {
      const attemptCount = (p as any).attempt_count ?? 0;
      const correctCount = (p as any).correct_count ?? 0;
      const accuracy = attemptCount > 0 ? correctCount / attemptCount : 0;
      const tier = computeTier(p.times_viewed, attemptCount, correctCount);
      return {
        word: p.word,
        tier,
        attemptCount,
        correctCount,
        accuracy,
        timesViewed: p.times_viewed,
      };
    });
  },

  /**
   * Count how many words have reached a given tier for a profile.
   */
  async countByTier(profileId: string, tier: MasteryTier): Promise<number> {
    const all = await this.getAllWordMastery(profileId);
    return all.filter((m) => m.tier === tier).length;
  },
};

// ─── Internal: Supabase sync ──────────────────────────────────────────────────

async function _syncAttemptToSupabase(
  profileId: string,
  word: string,
  correct: boolean,
): Promise<void> {
  try {
    // Fetch current counts from SQLite to write the authoritative state
    const progress = await sqliteService.getSingleWordProgress(profileId, word);
    if (!progress) return;

    await supabase.from('word_progress').upsert(
      {
        profile_id: profileId,
        word,
        attempt_count: (progress as any).attempt_count ?? 0,
        correct_count: (progress as any).correct_count ?? 0,
        last_seen_at: progress.last_viewed_at,
      },
      { onConflict: 'profile_id,word' },
    );
  } catch {
    // Silently ignore — SQLite is source of truth
  }
}
