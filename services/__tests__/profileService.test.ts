import { profileService } from '../profileService';
import { localProfileService } from '../localProfileService';
import { sqliteService } from '../sqliteService';
import { supabase } from '../../lib/supabase';

jest.mock('../sqliteService', () => ({
  sqliteService: {
    getAllProfiles: jest.fn(),
    getProfile: jest.fn(),
    insertProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'parent-123' } } }, error: null })),
    },
    rpc: jest.fn(() => Promise.resolve({ error: null })),
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a profile with parent_id from session', async () => {
    const profileData = {
      name: 'Kid 1',
      age: 5,
      gender: 'boy' as const,
      avatar_color: '#FF0000',
    };

    (sqliteService.insertProfile as jest.Mock).mockResolvedValue(undefined);

    const result = await profileService.createProfile(profileData);

    expect(result.name).toBe('Kid 1');
    expect(result.parent_id).toBe('parent-123');
    expect(sqliteService.insertProfile).toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith('upsert_kid_profile', expect.objectContaining({
      parent_id_val: 'parent-123'
    }));
  });

  it('should get all profiles from SQLite', async () => {
    const mockProfiles = [
      { id: '1', name: 'Kid 1' },
      { id: '2', name: 'Kid 2' },
    ];
    (sqliteService.getAllProfiles as jest.Mock).mockResolvedValue(mockProfiles);

    const result = await profileService.getAllProfiles();

    expect(result).toEqual(mockProfiles);
    expect(sqliteService.getAllProfiles).toHaveBeenCalled();
  });

  it('should handle errors when creating a profile', async () => {
    const profileData = {
      name: 'Kid 2',
      age: 7,
      gender: 'girl' as const,
      avatar_color: '#00FF00',
    };

    (sqliteService.insertProfile as jest.Mock).mockRejectedValue(new Error('SQLite Error'));

    await expect(profileService.createProfile(profileData)).rejects.toThrow('SQLite Error');
  });

  it('should update a profile and sync to Supabase', async () => {
    const profileId = 'kid-123';
    const updates = { name: 'New Name' };
    const mockProfile = { id: profileId, name: 'New Name', parent_id: 'parent-123' };

    (sqliteService.updateProfile as jest.Mock).mockResolvedValue(undefined);
    (sqliteService.getProfile as jest.Mock).mockResolvedValue(mockProfile);

    await profileService.updateProfile(profileId, updates);

    expect(sqliteService.updateProfile).toHaveBeenCalledWith(profileId, expect.objectContaining({
      name: 'New Name',
      supabase_synced: 0
    }));
    expect(supabase.rpc).toHaveBeenCalledWith('upsert_kid_profile', expect.objectContaining({
      name_val: 'New Name'
    }));
  });
});
