/**
 * localProfileService — all profile/progress operations backed by SQLite.
 *
 * Profiles are written to SQLite immediately (works offline).
 * A background call to syncProfileToSupabase() attempts cloud backup
 * when the device is online; it fails silently and is retried on next launch
 * via pushUnsyncedProfiles().
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { sqliteService } from './sqliteService';
import {
  KidProfile,
  WordProgress,
  Achievement,
  ProfileAchievement,
  DailyStreak,
} from '@/types/profile';

const ACTIVE_PROFILE_KEY = '@kidopedia_active_profile';
const XP_PER_LEVEL = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

async function syncProfileToSupabase(profile: KidProfile): Promise<void> {
  try {
    await supabase.from('kid_profiles').upsert({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      avatar_color: profile.avatar_color,
      avatar_url: profile.avatar_url ?? null,
      current_level: profile.current_level,
      total_xp: profile.total_xp,
      words_learned: profile.words_learned,
    });
    await sqliteService.updateProfile(profile.id, { supabase_synced: 1 } as any);
  } catch {
    // Silently ignore — will retry via pushUnsyncedProfiles on next launch
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const localProfileService = {
  // ── Profile CRUD ────────────────────────────────────────────────────────────

  async getAllProfiles(): Promise<KidProfile[]> {
    return sqliteService.getAllProfiles();
  },

  async getProfile(id: string): Promise<KidProfile | null> {
    return sqliteService.getProfile(id);
  },

  async createProfile(
    data: Omit<KidProfile, 'id' | 'created_at' | 'last_active_at' | 'current_level' | 'total_xp' | 'words_learned'>,
  ): Promise<KidProfile> {
    const profile: KidProfile = {
      id: generateId(),
      name: data.name,
      age: data.age,
      gender: data.gender,
      avatar_color: data.avatar_color,
      avatar_url: data.avatar_url,
      current_level: 1,
      total_xp: 0,
      words_learned: 0,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    await sqliteService.insertProfile({ ...profile, supabase_synced: 0 } as any);
    syncProfileToSupabase(profile); // fire-and-forget
    return profile;
  },

  async updateProfile(id: string, updates: Partial<KidProfile>): Promise<void> {
    await sqliteService.updateProfile(id, { ...updates, supabase_synced: 0 } as any);
    const updated = await sqliteService.getProfile(id);
    if (updated) syncProfileToSupabase(updated); // fire-and-forget
  },

  async deleteProfile(id: string): Promise<void> {
    // Also remove from Supabase if possible (best-effort)
    Promise.resolve(supabase.from('kid_profiles').delete().eq('id', id)).then(() => {}).catch(() => {});
    await sqliteService.deleteProfile(id);
  },

  // ── Active Profile ──────────────────────────────────────────────────────────

  async setActiveProfile(profileId: string): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    await sqliteService.updateProfile(profileId, {
      last_active_at: new Date().toISOString(),
    });
  },

  async getActiveProfileId(): Promise<string | null> {
    return AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  },

  async clearActiveProfile(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  },

  // ── Word Progress ────────────────────────────────────────────────────────────

  async getWordProgress(profileId: string): Promise<WordProgress[]> {
    return sqliteService.getWordProgress(profileId);
  },

  async getFavoriteWords(profileId: string): Promise<WordProgress[]> {
    return sqliteService.getFavoriteWords(profileId);
  },

  async trackWordView(profileId: string, word: string): Promise<void> {
    await sqliteService.upsertWordProgress(profileId, word);
  },

  async toggleFavorite(profileId: string, word: string): Promise<boolean> {
    return sqliteService.toggleFavorite(profileId, word);
  },

  // ── Achievements ──────────────────────────────────────────────────────────────

  async getAchievements(): Promise<Achievement[]> {
    return sqliteService.getAchievements();
  },

  async getProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
    return sqliteService.getProfileAchievements(profileId);
  },

  async unlockAchievement(profileId: string, achievementId: string): Promise<void> {
    await sqliteService.unlockAchievement(profileId, achievementId);
  },

  // ── Gamification ────────────────────────────────────────────────────────────

  async addXP(profileId: string, xp: number): Promise<void> {
    const profile = await sqliteService.getProfile(profileId);
    if (!profile) return;
    const newXp = profile.total_xp + xp;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    await sqliteService.updateProfile(profileId, {
      total_xp: newXp,
      current_level: newLevel,
    });
  },

  async incrementWordsLearned(profileId: string): Promise<void> {
    const profile = await sqliteService.getProfile(profileId);
    if (!profile) return;
    await sqliteService.updateProfile(profileId, {
      words_learned: profile.words_learned + 1,
    });
  },

  // ── Daily Streak ─────────────────────────────────────────────────────────────

  async getDailyStreak(profileId: string): Promise<DailyStreak | null> {
    return sqliteService.getDailyStreak(profileId);
  },

  async updateDailyActivity(profileId: string): Promise<void> {
    await sqliteService.updateDailyActivity(profileId);
  },

  // ── Background cloud sync ────────────────────────────────────────────────────

  /**
   * Called on app launch (when online). Pushes any profiles that were
   * created/modified while offline to Supabase.
   */
  async pushUnsyncedProfiles(): Promise<void> {
    try {
      const unsynced = await sqliteService.getUnsyncedProfiles();
      for (const profile of unsynced) {
        await syncProfileToSupabase(profile);
      }
    } catch {
      // Silently ignore
    }
  },
};
