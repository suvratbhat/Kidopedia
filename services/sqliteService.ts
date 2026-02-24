import * as SQLite from 'expo-sqlite';
import { CachedWord, Meaning } from '@/types/dictionary';
import {
  KidProfile,
  WordProgress,
  Achievement,
  ProfileAchievement,
  DailyStreak,
} from '@/types/profile';
import { BUILT_IN_ACHIEVEMENTS } from './achievementsData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncMetaRow {
  key: string;
  value: string;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('SQLite database is not initialized. Call initializeDatabase() first.');
  return db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}

function deserializeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function rowToCachedWord(row: Record<string, unknown>): CachedWord {
  return {
    id: (row.id as string) ?? '',
    word: row.word as string,
    phonetic: (row.phonetic as string) ?? '',
    audio_url: (row.audio_url as string) ?? '',
    meanings: deserializeJson<Meaning[]>(row.meanings as string, []),
    origin: (row.origin as string) ?? '',
    kannada_translation: row.kannada_translation as string | undefined,
    hindi_translation: row.hindi_translation as string | undefined,
    is_age_appropriate: (row.is_age_appropriate as number) !== 0,
    min_age: row.min_age as number | undefined,
    content_flags: deserializeJson<string[]>(row.content_flags as string, []),
    complexity_level: row.complexity_level as number | undefined,
    search_count: (row.search_count as number) ?? 0,
    created_at: (row.updated_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
  };
}

function rowToProfile(row: Record<string, unknown>): KidProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    gender: row.gender as 'boy' | 'girl' | 'other',
    avatar_color: row.avatar_color as string,
    avatar_url: row.avatar_url as string | undefined,
    current_level: row.current_level as number,
    total_xp: row.total_xp as number,
    words_learned: row.words_learned as number,
    created_at: row.created_at as string,
    last_active_at: row.last_active_at as string,
  };
}

// ─── Schema DDL ───────────────────────────────────────────────────────────────

const DDL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS words (
  word                TEXT PRIMARY KEY COLLATE NOCASE,
  phonetic            TEXT,
  audio_url           TEXT,
  meanings            TEXT NOT NULL DEFAULT '[]',
  origin              TEXT,
  kannada_translation TEXT DEFAULT '',
  hindi_translation   TEXT DEFAULT '',
  is_age_appropriate  INTEGER DEFAULT 1,
  min_age             INTEGER DEFAULT 2,
  content_flags       TEXT DEFAULT '[]',
  complexity_level    INTEGER DEFAULT 5,
  search_count        INTEGER DEFAULT 0,
  synced_at           TEXT,
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
  word,
  content='words',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS words_ai AFTER INSERT ON words BEGIN
  INSERT INTO words_fts(rowid, word) VALUES (new.rowid, new.word);
END;
CREATE TRIGGER IF NOT EXISTS words_ad AFTER DELETE ON words BEGIN
  INSERT INTO words_fts(words_fts, rowid, word) VALUES ('delete', old.rowid, old.word);
END;
CREATE TRIGGER IF NOT EXISTS words_au AFTER UPDATE ON words BEGIN
  INSERT INTO words_fts(words_fts, rowid, word) VALUES ('delete', old.rowid, old.word);
  INSERT INTO words_fts(rowid, word) VALUES (new.rowid, new.word);
END;

CREATE TABLE IF NOT EXISTS profiles (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  age             INTEGER NOT NULL,
  gender          TEXT NOT NULL,
  avatar_color    TEXT NOT NULL DEFAULT '#3B82F6',
  avatar_url      TEXT,
  current_level   INTEGER NOT NULL DEFAULT 1,
  total_xp        INTEGER NOT NULL DEFAULT 0,
  words_learned   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at  TEXT NOT NULL DEFAULT (datetime('now')),
  supabase_synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS word_progress (
  id             TEXT PRIMARY KEY,
  profile_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word           TEXT NOT NULL COLLATE NOCASE,
  times_viewed   INTEGER NOT NULL DEFAULT 1,
  is_favorite    INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profile_id, word)
);
CREATE INDEX IF NOT EXISTS idx_wp_profile ON word_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_wp_fav    ON word_progress(profile_id, is_favorite);

CREATE TABLE IF NOT EXISTS achievements (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  icon             TEXT,
  category         TEXT NOT NULL,
  unlock_condition TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS profile_achievements (
  id             TEXT PRIMARY KEY,
  profile_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(profile_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_pa_profile ON profile_achievements(profile_id);

CREATE TABLE IF NOT EXISTS daily_streak (
  id                 TEXT PRIMARY KEY,
  profile_id         TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  streak_count       INTEGER NOT NULL DEFAULT 1,
  longest_streak     INTEGER NOT NULL DEFAULT 1,
  last_activity_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recent_searches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT,
  word        TEXT NOT NULL COLLATE NOCASE,
  searched_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rs_profile ON recent_searches(profile_id, searched_at);

CREATE TABLE IF NOT EXISTS sync_metadata (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

// ─── Public API ───────────────────────────────────────────────────────────────

export const sqliteService = {
  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async initializeDatabase(): Promise<void> {
    if (db) return;
    db = await SQLite.openDatabaseAsync('kidopedia.db');
    await db.execAsync(DDL);
    await this.seedAchievements(BUILT_IN_ACHIEVEMENTS);
    await this.setSyncMeta('db_schema_version', '1');
    console.log('[SQLite] Database initialized');
  },

  // ── Words ──────────────────────────────────────────────────────────────────

  async upsertWord(word: CachedWord): Promise<void> {
    const d = getDb();
    await d.runAsync(
      `INSERT INTO words
         (word, phonetic, audio_url, meanings, origin,
          kannada_translation, hindi_translation,
          is_age_appropriate, min_age, content_flags,
          complexity_level, search_count, synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(word) DO UPDATE SET
         phonetic            = excluded.phonetic,
         audio_url           = excluded.audio_url,
         meanings            = excluded.meanings,
         origin              = excluded.origin,
         kannada_translation = excluded.kannada_translation,
         hindi_translation   = excluded.hindi_translation,
         is_age_appropriate  = excluded.is_age_appropriate,
         min_age             = excluded.min_age,
         content_flags       = excluded.content_flags,
         complexity_level    = excluded.complexity_level,
         search_count        = MAX(words.search_count, excluded.search_count),
         synced_at           = excluded.synced_at,
         updated_at          = excluded.updated_at`,
      [
        word.word.toLowerCase(),
        word.phonetic ?? null,
        word.audio_url ?? null,
        serializeJson(word.meanings),
        word.origin ?? null,
        word.kannada_translation ?? '',
        word.hindi_translation ?? '',
        word.is_age_appropriate !== false ? 1 : 0,
        word.min_age ?? 2,
        serializeJson(word.content_flags ?? []),
        word.complexity_level ?? 5,
        word.search_count ?? 0,
        now(),
        now(),
      ],
    );
  },

  async getWord(word: string): Promise<CachedWord | null> {
    const row = await getDb().getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM words WHERE word = ? COLLATE NOCASE',
      [word.toLowerCase()],
    );
    return row ? rowToCachedWord(row) : null;
  },

  async searchWords(query: string, limit = 20): Promise<CachedWord[]> {
    const sanitized = query.trim().replace(/['"*]/g, '').toLowerCase();
    if (!sanitized) return [];

    // FTS5 prefix search — falls back to LIKE if FTS returns nothing
    const ftsRows = await getDb().getAllAsync<{ rowid: number }>(
      `SELECT rowid FROM words_fts WHERE word MATCH ? ORDER BY rank LIMIT ?`,
      [`${sanitized}*`, limit],
    );

    if (ftsRows.length === 0) {
      // LIKE fallback for very short queries or edge cases
      const likeRows = await getDb().getAllAsync<Record<string, unknown>>(
        `SELECT * FROM words WHERE word LIKE ? ORDER BY search_count DESC LIMIT ?`,
        [`${sanitized}%`, limit],
      );
      return likeRows.map(rowToCachedWord);
    }

    const placeholders = ftsRows.map(() => '?').join(',');
    const rowids = ftsRows.map((r) => r.rowid);
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      `SELECT * FROM words WHERE rowid IN (${placeholders}) ORDER BY search_count DESC`,
      rowids,
    );
    return rows.map(rowToCachedWord);
  },

  async getAllCachedWords(): Promise<CachedWord[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      'SELECT * FROM words ORDER BY search_count DESC',
    );
    return rows.map(rowToCachedWord);
  },

  async getRandomWord(maxAge = 12): Promise<CachedWord | null> {
    const row = await getDb().getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM words
       WHERE is_age_appropriate = 1 AND min_age <= ?
       ORDER BY RANDOM() LIMIT 1`,
      [maxAge],
    );
    return row ? rowToCachedWord(row) : null;
  },

  async getPopularWords(limit = 20, maxAge = 12): Promise<CachedWord[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      `SELECT * FROM words
       WHERE is_age_appropriate = 1 AND min_age <= ?
       ORDER BY search_count DESC LIMIT ?`,
      [maxAge, limit],
    );
    return rows.map(rowToCachedWord);
  },

  async getWordCount(): Promise<number> {
    const row = await getDb().getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM words',
    );
    return row?.cnt ?? 0;
  },

  async incrementWordSearchCount(word: string): Promise<void> {
    await getDb().runAsync(
      `UPDATE words SET search_count = search_count + 1 WHERE word = ? COLLATE NOCASE`,
      [word.toLowerCase()],
    );
  },

  async clearAllWords(): Promise<void> {
    await getDb().execAsync('DELETE FROM words; DELETE FROM words_fts;');
  },

  // ── Profiles ───────────────────────────────────────────────────────────────

  async insertProfile(profile: KidProfile & { supabase_synced?: number }): Promise<void> {
    await getDb().runAsync(
      `INSERT INTO profiles
         (id, name, age, gender, avatar_color, avatar_url,
          current_level, total_xp, words_learned,
          created_at, last_active_at, supabase_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.age,
        profile.gender,
        profile.avatar_color,
        profile.avatar_url ?? null,
        profile.current_level ?? 1,
        profile.total_xp ?? 0,
        profile.words_learned ?? 0,
        profile.created_at ?? now(),
        profile.last_active_at ?? now(),
        profile.supabase_synced ?? 0,
      ],
    );
  },

  async updateProfile(id: string, updates: Partial<KidProfile & { supabase_synced: number }>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined)           { fields.push('name = ?');            values.push(updates.name); }
    if (updates.age !== undefined)            { fields.push('age = ?');             values.push(updates.age); }
    if (updates.gender !== undefined)         { fields.push('gender = ?');          values.push(updates.gender); }
    if (updates.avatar_color !== undefined)   { fields.push('avatar_color = ?');    values.push(updates.avatar_color); }
    if (updates.avatar_url !== undefined)     { fields.push('avatar_url = ?');      values.push(updates.avatar_url); }
    if (updates.current_level !== undefined)  { fields.push('current_level = ?');   values.push(updates.current_level); }
    if (updates.total_xp !== undefined)       { fields.push('total_xp = ?');        values.push(updates.total_xp); }
    if (updates.words_learned !== undefined)  { fields.push('words_learned = ?');   values.push(updates.words_learned); }
    if (updates.last_active_at !== undefined) { fields.push('last_active_at = ?');  values.push(updates.last_active_at); }
    if ((updates as any).supabase_synced !== undefined) {
      fields.push('supabase_synced = ?');
      values.push((updates as any).supabase_synced);
    }

    if (fields.length === 0) return;
    values.push(id);
    await getDb().runAsync(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`,
      values as any[],
    );
  },

  async deleteProfile(id: string): Promise<void> {
    await getDb().runAsync('DELETE FROM profiles WHERE id = ?', [id]);
  },

  async getProfile(id: string): Promise<KidProfile | null> {
    const row = await getDb().getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE id = ?',
      [id],
    );
    return row ? rowToProfile(row) : null;
  },

  async getAllProfiles(): Promise<KidProfile[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      'SELECT * FROM profiles ORDER BY last_active_at DESC',
    );
    return rows.map(rowToProfile);
  },

  async getUnsyncedProfiles(): Promise<(KidProfile & { supabase_synced: number })[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE supabase_synced = 0',
    );
    return rows.map((r) => ({ ...rowToProfile(r), supabase_synced: 0 }));
  },

  // ── Word Progress ──────────────────────────────────────────────────────────

  async upsertWordProgress(profileId: string, word: string, isFavorite?: boolean): Promise<void> {
    const existing = await getDb().getFirstAsync<{ id: string; times_viewed: number; is_favorite: number }>(
      'SELECT id, times_viewed, is_favorite FROM word_progress WHERE profile_id = ? AND word = ? COLLATE NOCASE',
      [profileId, word.toLowerCase()],
    );

    if (existing) {
      await getDb().runAsync(
        `UPDATE word_progress
         SET times_viewed = ?, is_favorite = ?, last_viewed_at = ?
         WHERE id = ?`,
        [
          existing.times_viewed + 1,
          isFavorite !== undefined ? (isFavorite ? 1 : 0) : existing.is_favorite,
          now(),
          existing.id,
        ],
      );
    } else {
      await getDb().runAsync(
        `INSERT INTO word_progress (id, profile_id, word, times_viewed, is_favorite, last_viewed_at, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [generateId(), profileId, word.toLowerCase(), isFavorite ? 1 : 0, now(), now()],
      );
    }
  },

  async toggleFavorite(profileId: string, word: string): Promise<boolean> {
    const existing = await getDb().getFirstAsync<{ id: string; is_favorite: number }>(
      'SELECT id, is_favorite FROM word_progress WHERE profile_id = ? AND word = ? COLLATE NOCASE',
      [profileId, word.toLowerCase()],
    );

    if (existing) {
      const newVal = existing.is_favorite === 0 ? 1 : 0;
      await getDb().runAsync(
        'UPDATE word_progress SET is_favorite = ? WHERE id = ?',
        [newVal, existing.id],
      );
      return newVal === 1;
    } else {
      await getDb().runAsync(
        `INSERT INTO word_progress (id, profile_id, word, times_viewed, is_favorite, last_viewed_at, created_at)
         VALUES (?, ?, ?, 1, 1, ?, ?)`,
        [generateId(), profileId, word.toLowerCase(), now(), now()],
      );
      return true;
    }
  },

  async getWordProgress(profileId: string): Promise<WordProgress[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      `SELECT * FROM word_progress WHERE profile_id = ? ORDER BY last_viewed_at DESC`,
      [profileId],
    );
    return rows.map((r) => ({
      id: r.id as string,
      profile_id: r.profile_id as string,
      word: r.word as string,
      times_viewed: r.times_viewed as number,
      is_favorite: (r.is_favorite as number) === 1,
      last_viewed_at: r.last_viewed_at as string,
      created_at: (r.created_at as string) ?? '',
    }));
  },

  async getFavoriteWords(profileId: string): Promise<WordProgress[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      `SELECT * FROM word_progress WHERE profile_id = ? AND is_favorite = 1 ORDER BY last_viewed_at DESC`,
      [profileId],
    );
    return rows.map((r) => ({
      id: r.id as string,
      profile_id: r.profile_id as string,
      word: r.word as string,
      times_viewed: r.times_viewed as number,
      is_favorite: true,
      last_viewed_at: r.last_viewed_at as string,
      created_at: (r.created_at as string) ?? '',
    }));
  },

  async getFavoritesCount(profileId: string): Promise<number> {
    const row = await getDb().getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM word_progress WHERE profile_id = ? AND is_favorite = 1',
      [profileId],
    );
    return row?.cnt ?? 0;
  },

  // ── Achievements ───────────────────────────────────────────────────────────

  async seedAchievements(achievements: Achievement[]): Promise<void> {
    const d = getDb();
    await d.withTransactionAsync(async () => {
      for (const a of achievements) {
        await d.runAsync(
          `INSERT OR IGNORE INTO achievements
             (id, code, title, description, icon, category, unlock_condition)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.code, a.title, a.description ?? '', a.icon ?? '', a.category, serializeJson(a.unlock_condition)],
        );
      }
    });
  },

  async getAchievements(): Promise<Achievement[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      'SELECT * FROM achievements',
    );
    return rows.map((r) => ({
      id: r.id as string,
      code: r.code as string,
      title: r.title as string,
      description: r.description as string,
      icon: r.icon as string,
      category: r.category as Achievement['category'],
      unlock_condition: deserializeJson(r.unlock_condition as string, {}),
    }));
  },

  async getProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
    const rows = await getDb().getAllAsync<Record<string, unknown>>(
      `SELECT pa.*, a.code, a.title, a.description, a.icon, a.category
       FROM profile_achievements pa
       JOIN achievements a ON a.id = pa.achievement_id
       WHERE pa.profile_id = ?
       ORDER BY pa.unlocked_at DESC`,
      [profileId],
    );
    return rows.map((r) => ({
      id: r.id as string,
      profile_id: r.profile_id as string,
      achievement_id: r.achievement_id as string,
      unlocked_at: r.unlocked_at as string,
    }));
  },

  async unlockAchievement(profileId: string, achievementId: string): Promise<void> {
    await getDb().runAsync(
      `INSERT OR IGNORE INTO profile_achievements (id, profile_id, achievement_id, unlocked_at)
       VALUES (?, ?, ?, ?)`,
      [generateId(), profileId, achievementId, now()],
    );
  },

  // ── Daily Streak ───────────────────────────────────────────────────────────

  async getDailyStreak(profileId: string): Promise<DailyStreak | null> {
    const row = await getDb().getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM daily_streak WHERE profile_id = ?',
      [profileId],
    );
    if (!row) return null;
    return {
      id: row.id as string,
      profile_id: row.profile_id as string,
      streak_count: row.streak_count as number,
      longest_streak: row.longest_streak as number,
      last_activity_date: row.last_activity_date as string,
    };
  },

  async updateDailyActivity(profileId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getDailyStreak(profileId);

    if (!existing) {
      await getDb().runAsync(
        `INSERT INTO daily_streak (id, profile_id, streak_count, longest_streak, last_activity_date)
         VALUES (?, ?, 1, 1, ?)`,
        [generateId(), profileId, today],
      );
      return;
    }

    if (existing.last_activity_date === today) return; // already updated today

    const last = new Date(existing.last_activity_date);
    const diff = Math.floor((Date.now() - last.getTime()) / 86_400_000);
    const newStreak = diff === 1 ? existing.streak_count + 1 : 1;
    const newLongest = Math.max(existing.longest_streak, newStreak);

    await getDb().runAsync(
      `UPDATE daily_streak SET streak_count = ?, longest_streak = ?, last_activity_date = ?
       WHERE profile_id = ?`,
      [newStreak, newLongest, today, profileId],
    );
  },

  // ── Sync Metadata ──────────────────────────────────────────────────────────

  async getSyncMeta(key: string): Promise<string | null> {
    const row = await getDb().getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  },

  async setSyncMeta(key: string, value: string): Promise<void> {
    await getDb().runAsync(
      `INSERT INTO sync_metadata (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  },

  async getSyncMetaBulk(keys: string[]): Promise<Record<string, string>> {
    const placeholders = keys.map(() => '?').join(',');
    const rows = await getDb().getAllAsync<SyncMetaRow>(
      `SELECT key, value FROM sync_metadata WHERE key IN (${placeholders})`,
      keys,
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },

  // ── Recent Searches ────────────────────────────────────────────────────────

  async addRecentSearch(profileId: string | null, word: string): Promise<void> {
    const d = getDb();
    // Remove duplicate if exists
    await d.runAsync(
      'DELETE FROM recent_searches WHERE (profile_id IS ? OR (profile_id IS NULL AND ? IS NULL)) AND word = ? COLLATE NOCASE',
      [profileId, profileId, word],
    );
    await d.runAsync(
      'INSERT INTO recent_searches (profile_id, word, searched_at) VALUES (?, ?, ?)',
      [profileId, word.toLowerCase(), now()],
    );
    // Keep only latest 30 per profile
    await d.runAsync(
      `DELETE FROM recent_searches
       WHERE (profile_id IS ? OR (profile_id IS NULL AND ? IS NULL))
         AND id NOT IN (
           SELECT id FROM recent_searches
           WHERE (profile_id IS ? OR (profile_id IS NULL AND ? IS NULL))
           ORDER BY searched_at DESC LIMIT 30
         )`,
      [profileId, profileId, profileId, profileId],
    );
  },

  async getRecentSearches(profileId: string | null, limit = 20): Promise<string[]> {
    const rows = await getDb().getAllAsync<{ word: string }>(
      `SELECT word FROM recent_searches
       WHERE (profile_id IS ? OR (profile_id IS NULL AND ? IS NULL))
       ORDER BY searched_at DESC LIMIT ?`,
      [profileId, profileId, limit],
    );
    return rows.map((r) => r.word);
  },

  async clearRecentSearches(profileId: string | null): Promise<void> {
    await getDb().runAsync(
      'DELETE FROM recent_searches WHERE (profile_id IS ? OR (profile_id IS NULL AND ? IS NULL))',
      [profileId, profileId],
    );
  },
};
