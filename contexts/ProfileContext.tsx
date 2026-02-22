import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KidProfile, Theme, BOY_THEME, GIRL_THEME, NEUTRAL_THEME } from '@/types/profile';
import { profileService } from '@/services/profileService';
import { databaseService } from '@/services/databaseService';

interface ProfileContextType {
  activeProfile: KidProfile | null;
  profiles: KidProfile[];
  theme: Theme;
  loading: boolean;
  setActiveProfile: (profile: KidProfile) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  createProfile: (profile: Omit<KidProfile, 'id' | 'created_at' | 'last_active_at' | 'current_level' | 'total_xp' | 'words_learned'>) => Promise<KidProfile>;
  updateProfile: (id: string, updates: Partial<KidProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  clearActiveProfile: () => Promise<void>;
}

const defaultContextValue: ProfileContextType = {
  activeProfile: null,
  profiles: [],
  theme: NEUTRAL_THEME,
  loading: true,
  setActiveProfile: async () => {},
  refreshProfiles: async () => {},
  createProfile: async () => ({} as KidProfile),
  updateProfile: async () => {},
  deleteProfile: async () => {},
  clearActiveProfile: async () => {},
};

const ProfileContext = createContext<ProfileContextType>(defaultContextValue);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<KidProfile | null>(null);
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [theme, setTheme] = useState<Theme>(NEUTRAL_THEME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (activeProfile) {
      updateTheme(activeProfile.gender);
      databaseService.setProfileAge(activeProfile.age);
    } else {
      setTheme(NEUTRAL_THEME);
      databaseService.setProfileAge(8);
    }
  }, [activeProfile]);

  const updateTheme = (gender: 'boy' | 'girl' | 'other') => {
    switch (gender) {
      case 'boy':
        setTheme(BOY_THEME);
        break;
      case 'girl':
        setTheme(GIRL_THEME);
        break;
      default:
        setTheme(NEUTRAL_THEME);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = await profileService.getAllProfiles();
      setProfiles(allProfiles);

      const activeProfileId = await profileService.getActiveProfileId();
      if (activeProfileId) {
        const profile = allProfiles.find((p) => p.id === activeProfileId);
        if (profile) {
          setActiveProfileState(profile);
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveProfile = async (profile: KidProfile) => {
    await profileService.setActiveProfile(profile.id);
    setActiveProfileState(profile);
  };

  const refreshProfiles = async () => {
    await loadProfiles();
  };

  const createProfile = async (
    profileData: Omit<KidProfile, 'id' | 'created_at' | 'last_active_at' | 'current_level' | 'total_xp' | 'words_learned'>
  ): Promise<KidProfile> => {
    const newProfile = await profileService.createProfile(profileData);
    await refreshProfiles();
    return newProfile;
  };

  const updateProfile = async (id: string, updates: Partial<KidProfile>) => {
    await profileService.updateProfile(id, updates);
    await refreshProfiles();
    if (activeProfile?.id === id) {
      const updatedProfile = await profileService.getProfile(id);
      if (updatedProfile) {
        setActiveProfileState(updatedProfile);
      }
    }
  };

  const deleteProfile = async (id: string) => {
    await profileService.deleteProfile(id);
    if (activeProfile?.id === id) {
      await profileService.clearActiveProfile();
      setActiveProfileState(null);
    }
    await refreshProfiles();
  };

  const clearActiveProfile = async () => {
    await profileService.clearActiveProfile();
    setActiveProfileState(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        theme,
        loading,
        setActiveProfile,
        refreshProfiles,
        createProfile,
        updateProfile,
        deleteProfile,
        clearActiveProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  return context;
}

export { ProfileContext };
