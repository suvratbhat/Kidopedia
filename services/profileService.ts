import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KidProfile,
  WordProgress,
  Achievement,
  ProfileAchievement,
  DailyStreak,
} from '@/types/profile';

const ACTIVE_PROFILE_KEY = '@kidopedia_active_profile';

export const profileService = {
  async getAllProfiles(): Promise<KidProfile[]> {
    const { data, error } = await supabase
      .from('kid_profiles')
      .select('*')
      .order('last_active_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProfile(id: string): Promise<KidProfile | null> {
    const { data, error } = await supabase
      .from('kid_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProfile(profile: Omit<KidProfile, 'id' | 'created_at' | 'last_active_at' | 'current_level' | 'total_xp' | 'words_learned'>): Promise<KidProfile> {
    console.log('ProfileService: Creating profile', profile);

    const { data, error } = await supabase
      .from('kid_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.error('ProfileService: Create profile error', error);
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    console.log('ProfileService: Profile created successfully', data);
    return data;
  },

  async updateProfile(id: string, updates: Partial<KidProfile>): Promise<KidProfile> {
    const { data, error } = await supabase
      .from('kid_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('kid_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setActiveProfile(profileId: string): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    await this.updateProfile(profileId, { last_active_at: new Date().toISOString() });
  },

  async getActiveProfileId(): Promise<string | null> {
    return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  },

  async clearActiveProfile(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  },

  async getWordProgress(profileId: string): Promise<WordProgress[]> {
    const { data, error } = await supabase
      .from('word_progress')
      .select('*')
      .eq('profile_id', profileId)
      .order('last_viewed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getFavoriteWords(profileId: string): Promise<WordProgress[]> {
    const { data, error } = await supabase
      .from('word_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_favorite', true)
      .order('last_viewed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async trackWordView(profileId: string, word: string): Promise<void> {
    const { data: existing } = await supabase
      .from('word_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('word', word)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('word_progress')
        .update({
          times_viewed: existing.times_viewed + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('word_progress')
        .insert([{
          profile_id: profileId,
          word,
          times_viewed: 1,
          is_favorite: false,
        }]);
    }

    await this.updateDailyActivity(profileId);
  },

  async toggleFavorite(profileId: string, word: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('word_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('word', word)
      .maybeSingle();

    if (existing) {
      const newFavoriteState = !existing.is_favorite;
      await supabase
        .from('word_progress')
        .update({ is_favorite: newFavoriteState })
        .eq('id', existing.id);
      return newFavoriteState;
    } else {
      await supabase
        .from('word_progress')
        .insert([{
          profile_id: profileId,
          word,
          times_viewed: 1,
          is_favorite: true,
        }]);
      return true;
    }
  },

  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getProfileAchievements(profileId: string): Promise<ProfileAchievement[]> {
    const { data, error } = await supabase
      .from('profile_achievements')
      .select('*')
      .eq('profile_id', profileId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async unlockAchievement(profileId: string, achievementId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('profile_achievements')
      .select('*')
      .eq('profile_id', profileId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from('profile_achievements')
        .insert([{
          profile_id: profileId,
          achievement_id: achievementId,
        }]);
    }
  },

  async getDailyStreak(profileId: string): Promise<DailyStreak | null> {
    const { data, error } = await supabase
      .from('daily_streak')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateDailyActivity(profileId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const { data: streak } = await supabase
      .from('daily_streak')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!streak) {
      await supabase
        .from('daily_streak')
        .insert([{
          profile_id: profileId,
          streak_count: 1,
          last_activity_date: today,
          longest_streak: 1,
        }]);
    } else {
      const lastDate = new Date(streak.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const newStreak = streak.streak_count + 1;
        await supabase
          .from('daily_streak')
          .update({
            streak_count: newStreak,
            last_activity_date: today,
            longest_streak: Math.max(newStreak, streak.longest_streak),
          })
          .eq('id', streak.id);
      } else if (diffDays > 1) {
        await supabase
          .from('daily_streak')
          .update({
            streak_count: 1,
            last_activity_date: today,
          })
          .eq('id', streak.id);
      }
    }
  },

  async addXP(profileId: string, xp: number): Promise<void> {
    const profile = await this.getProfile(profileId);
    if (!profile) return;

    const newTotalXP = profile.total_xp + xp;
    const newLevel = Math.floor(newTotalXP / 100) + 1;

    await this.updateProfile(profileId, {
      total_xp: newTotalXP,
      current_level: newLevel,
    });
  },

  async incrementWordsLearned(profileId: string): Promise<void> {
    const profile = await this.getProfile(profileId);
    if (!profile) return;

    await this.updateProfile(profileId, {
      words_learned: profile.words_learned + 1,
    });
  },
};
