/**
 * profileService — thin delegation layer over localProfileService.
 *
 * All data is stored in SQLite (works 100% offline).
 * Supabase cloud backup happens silently in the background via localProfileService.
 *
 * All call-sites (ProfileContext, tab screens, profiles.tsx) remain unchanged.
 */
import {
  KidProfile,
  WordProgress,
  Achievement,
  ProfileAchievement,
  DailyStreak,
} from '@/types/profile';
import { localProfileService } from './localProfileService';

export const profileService = {
  async getAllProfiles(): Promise<KidProfile[]> {
    return localProfileService.getAllProfiles();
  },

  async getProfile(id: string): Promise<KidProfile | null> {
    return localProfileService.getProfile(id);
  },

  async createProfile(
    profile: Omit<KidProfile, 'id' | 'created_at' | 'last_active_at' | 'current_level' | 'total_xp' | 'words_learned'>,
  ): Promise<KidProfile> {
    return localProfileService.createProfile(profile);
  },

  async updateProfile(id: string, updates: Partial<KidProfile>): Promise<KidProfile> {
    await localProfileService.updateProfile(id, updates);
    const updated = await localProfileService.getProfile(id);
    if (!updated) throw new Error(`Profile ${id} not found after update`);
    return updated;
  },

  async deleteProfile(id: string): Promise<void> {
    return localProfileService.deleteProfile(id);
  },

  async setActiveProfile(profileId: string): Promise<void> {
    return localProfileService.setActiveProfile(profileId);
  },

  async getActiveProfileId(): Promise<string | null> {
    return localProfileService.getActiveProfileId();
  },

  async clearActiveProfile(): Promise<void> {
    return localProfileService.clearActiveProfile();
  },

  async getWordProgress(profileId: string): Promise<WordProgress[]> {
    return localProfileService.getWordProgress(profileId);
  },

  async getFavoriteWords(profileId: string): Promise<WordProgress[]> {
    return localProfileService.getFavoriteWords(profileId);
  },

  async trackWordView(profileId: string, word: string): Promise<void> {
    await localProfileService.trackWordView(profileId, word);
    await localProfileService.updateDailyActivity(profileId);
  },

  async toggleFavorite(profileId: string, word: string): Promise<boolean> {
    return localProfileService.toggleFavorite(profileId, word);
  },

  async getAchievements(): Promise<Achievement[]> {
    return localProfileService.getAchievements();
  },

  async getProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
    return localProfileService.getProfileAchievements(profileId);
  },

  async unlockAchievement(profileId: string, achievementId: string): Promise<void> {
    return localProfileService.unlockAchievement(profileId, achievementId);
  },

  async getDailyStreak(profileId: string): Promise<DailyStreak | null> {
    return localProfileService.getDailyStreak(profileId);
  },

  async updateDailyActivity(profileId: string): Promise<void> {
    return localProfileService.updateDailyActivity(profileId);
  },

  async addXP(profileId: string, xp: number): Promise<void> {
    return localProfileService.addXP(profileId, xp);
  },

  async incrementWordsLearned(profileId: string): Promise<void> {
    return localProfileService.incrementWordsLearned(profileId);
  },
};
