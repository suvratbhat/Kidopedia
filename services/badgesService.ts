import { supabase } from '@/lib/supabase';

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlock_condition: any;
}

export interface EarnedBadge {
  id: string;
  profile_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export const badgesService = {
  /**
   * Fetch all available badges from Supabase
   */
  async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetch badges earned by a specific kid profile
   */
  async getEarnedBadges(profileId: string): Promise<EarnedBadge[]> {
    const { data, error } = await supabase
      .from('kid_badges')
      .select('*, badge:badges(*)')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching earned badges:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Trigger the badge evaluator edge function to check for new milestones
   * Returns a list of newly unlocked badges
   */
  async evaluateBadges(profileId: string): Promise<{ newlyUnlocked: Badge[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('badge-evaluator', {
        body: { profileId },
      });

      if (error) {
        console.error('Error invoking badge-evaluator:', error);
        throw error;
      }
      return data || { newlyUnlocked: [] };
    } catch (err) {
      console.error('Exception in evaluateBadges:', err);
      return { newlyUnlocked: [] };
    }
  }
};
