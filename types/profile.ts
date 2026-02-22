export interface KidProfile {
  id: string;
  name: string;
  age: number;
  gender: 'boy' | 'girl' | 'other';
  avatar_color: string;
  avatar_url?: string;
  current_level: number;
  total_xp: number;
  words_learned: number;
  created_at: string;
  last_active_at: string;
}

export interface WordProgress {
  id: string;
  profile_id: string;
  word: string;
  times_viewed: number;
  is_favorite: boolean;
  last_viewed_at: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'words' | 'streak' | 'exploration' | 'social';
  unlock_condition: Record<string, any>;
}

export interface ProfileAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface DailyStreak {
  id: string;
  profile_id: string;
  streak_count: number;
  last_activity_date: string;
  longest_streak: number;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const BOY_THEME: Theme = {
  primary: '#3B82F6',
  secondary: '#60A5FA',
  accent: '#8B5CF6',
  background: '#F0F9FF',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const GIRL_THEME: Theme = {
  primary: '#EC4899',
  secondary: '#F9A8D4',
  accent: '#A855F7',
  background: '#FFF1F2',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#FCE7F3',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const NEUTRAL_THEME: Theme = {
  primary: '#10B981',
  secondary: '#34D399',
  accent: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};
