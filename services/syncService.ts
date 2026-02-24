/**
 * syncService — 90-day dictionary sync orchestration.
 *
 * Fetches words from the Supabase cached_words table in batches of 50,
 * stores them in the local SQLite database, and tracks progress so that
 * an interrupted sync can be resumed on next launch.
 *
 * The 90-day clock:
 *   next_sync_due_at = last_full_sync_completed_at + 90 days
 *   isSyncNeeded()   returns true when now >= next_sync_due_at
 *                    or when a sync has never completed
 */

import { supabase } from '@/lib/supabase';
import { sqliteService } from './sqliteService';
import { SyncStatus } from '@/types/sync';
import { CachedWord } from '@/types/dictionary';

const SYNC_INTERVAL_DAYS = 90;
const BATCH_SIZE = 50;
const INTER_BATCH_DELAY_MS = 200;
const MAX_RETRIES = 3;

type ProgressCallback = (status: SyncStatus) => void;

class SyncService {
  private cancelled = false;
  private activeCallback: ProgressCallback | null = null;

  // ── Status helpers ──────────────────────────────────────────────────────────

  async getSyncStatus(): Promise<SyncStatus> {
    const meta = await sqliteService.getSyncMetaBulk([
      'sync_status',
      'last_full_sync_completed_at',
      'next_sync_due_at',
      'sync_words_total',
      'sync_words_completed',
      'sync_error_message',
    ]);

    const rawStatus = meta['sync_status'] ?? 'never_synced';
    const status = rawStatus as SyncStatus['status'];
    const lastCompletedAt = meta['last_full_sync_completed_at'] || null;
    const nextDueAt = meta['next_sync_due_at'] || null;
    const wordsTotal = parseInt(meta['sync_words_total'] ?? '0', 10);
    const wordsCompleted = parseInt(meta['sync_words_completed'] ?? '0', 10);
    const percentage = wordsTotal > 0 ? Math.round((wordsCompleted / wordsTotal) * 100) : 0;

    let daysUntilNextSync: number | null = null;
    if (nextDueAt) {
      daysUntilNextSync = Math.ceil(
        (new Date(nextDueAt).getTime() - Date.now()) / 86_400_000,
      );
    }

    return {
      status,
      lastCompletedAt,
      nextDueAt,
      daysUntilNextSync,
      wordsTotal,
      wordsCompleted,
      percentage,
      errorMessage: meta['sync_error_message'] || null,
    };
  }

  async isSyncNeeded(): Promise<boolean> {
    const status = await this.getSyncStatus();
    if (status.status === 'never_synced') return true;
    if (status.daysUntilNextSync !== null && status.daysUntilNextSync <= 0) return true;
    return false;
  }

  async getDaysUntilNextSync(): Promise<number | null> {
    const status = await this.getSyncStatus();
    return status.daysUntilNextSync;
  }

  // ── Core sync ────────────────────────────────────────────────────────────────

  cancelSync(): void {
    this.cancelled = true;
    console.log('[Sync] Cancellation requested');
  }

  /**
   * Start or resume the 90-day sync.
   * Safe to call even if a sync is already in progress —
   * it will resume from where it left off.
   */
  async startSync(onProgress?: ProgressCallback): Promise<void> {
    if (onProgress) this.activeCallback = onProgress;
    this.cancelled = false;

    console.log('[Sync] Starting sync...');

    // Read resume offset
    const offsetStr = await sqliteService.getSyncMeta('sync_last_offset');
    let offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Mark as in-progress
    await sqliteService.setSyncMeta('sync_status', 'in_progress');
    if (!offsetStr || offset === 0) {
      await sqliteService.setSyncMeta('last_sync_started_at', new Date().toISOString());
      await sqliteService.setSyncMeta('sync_last_offset', '0');
      await sqliteService.setSyncMeta('sync_words_completed', '0');
      await sqliteService.setSyncMeta('sync_words_total', '0');
      await sqliteService.setSyncMeta('sync_error_message', '');
    }

    try {
      // Get total word count from Supabase for progress display
      const { count } = await supabase
        .from('cached_words')
        .select('word', { count: 'exact', head: true })
        .eq('is_age_appropriate', true)
        .lte('min_age', 12);
      const total = count ?? 0;
      await sqliteService.setSyncMeta('sync_words_total', String(total));

      let wordsCompleted = parseInt(
        (await sqliteService.getSyncMeta('sync_words_completed')) ?? '0',
        10,
      );

      this.notifyProgress({ offset, wordsCompleted, total });

      // Main fetch loop
      while (true) {
        if (this.cancelled) {
          await sqliteService.setSyncMeta('sync_status', 'failed');
          await sqliteService.setSyncMeta('sync_error_message', 'Sync cancelled by user');
          this.notifyProgress({ offset, wordsCompleted, total });
          return;
        }

        const batch = await this.fetchBatchWithRetry(offset);

        if (batch.length === 0) break; // All words fetched

        // Write batch to SQLite in a single transaction
        const d = await sqliteService['getSyncMetaBulk'](['db_schema_version']); // warm up
        await this.saveBatch(batch);

        offset += batch.length;
        wordsCompleted += batch.length;

        await sqliteService.setSyncMeta('sync_last_offset', String(offset));
        await sqliteService.setSyncMeta('sync_words_completed', String(wordsCompleted));

        this.notifyProgress({ offset, wordsCompleted, total });

        if (batch.length < BATCH_SIZE) break; // Last page

        await sleep(INTER_BATCH_DELAY_MS);
      }

      // Mark complete
      const completedAt = new Date().toISOString();
      const nextDueAt = new Date(
        Date.now() + SYNC_INTERVAL_DAYS * 86_400_000,
      ).toISOString();

      await sqliteService.setSyncMeta('sync_status', 'completed');
      await sqliteService.setSyncMeta('last_full_sync_completed_at', completedAt);
      await sqliteService.setSyncMeta('next_sync_due_at', nextDueAt);
      await sqliteService.setSyncMeta('sync_last_offset', '0'); // Reset for next sync
      await sqliteService.setSyncMeta('sync_error_message', '');

      const wordCount = await sqliteService.getWordCount();
      console.log(`[Sync] Completed. ${wordCount} words in local database.`);
      this.notifyProgress({ offset, wordsCompleted, total: wordsCompleted });
    } catch (error: any) {
      const msg = error?.message ?? 'Unknown error';
      console.error('[Sync] Failed:', msg);
      await sqliteService.setSyncMeta('sync_status', 'failed');
      await sqliteService.setSyncMeta('sync_error_message', msg);
      this.notifyProgress({ offset, wordsCompleted: 0, total: 0 });
      throw error;
    }
  }

  /** Force a sync regardless of the 90-day schedule */
  async forceSync(onProgress?: ProgressCallback): Promise<void> {
    // Reset the offset so we do a full re-fetch
    await sqliteService.setSyncMeta('sync_last_offset', '0');
    await sqliteService.setSyncMeta('sync_status', 'idle');
    return this.startSync(onProgress);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async fetchBatchWithRetry(offset: number): Promise<CachedWord[]> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.fetchBatch(offset);
      } catch (err: any) {
        lastError = err;
        await sleep(1000 * Math.pow(3, attempt)); // 1s, 3s, 9s
      }
    }
    throw lastError ?? new Error('Fetch failed after retries');
  }

  private async fetchBatch(offset: number): Promise<CachedWord[]> {
    const { data, error } = await supabase
      .from('cached_words')
      .select(
        'word, phonetic, audio_url, meanings, origin, kannada_translation, hindi_translation, ' +
        'is_age_appropriate, min_age, content_flags, complexity_level, search_count',
      )
      .eq('is_age_appropriate', true)
      .lte('min_age', 12)
      .order('search_count', { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data ?? []) as unknown as CachedWord[];
  }

  private async saveBatch(words: CachedWord[]): Promise<void> {
    // Use withTransactionAsync for performance (batch inserts in one transaction)
    const db = (sqliteService as any)['getDb']?.() ?? (sqliteService as any)['db'];
    if (db && typeof db.withTransactionAsync === 'function') {
      await db.withTransactionAsync(async () => {
        for (const word of words) {
          await sqliteService.upsertWord(word);
        }
      });
    } else {
      for (const word of words) {
        await sqliteService.upsertWord(word);
      }
    }
  }

  private notifyProgress({
    offset,
    wordsCompleted,
    total,
  }: {
    offset: number;
    wordsCompleted: number;
    total: number;
  }): void {
    if (!this.activeCallback) return;
    const percentage = total > 0 ? Math.round((wordsCompleted / total) * 100) : 0;
    this.getSyncStatus().then((status) => {
      this.activeCallback?.({
        ...status,
        wordsCompleted,
        wordsTotal: total,
        percentage,
      });
    }).catch(() => {});
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const syncService = new SyncService();
