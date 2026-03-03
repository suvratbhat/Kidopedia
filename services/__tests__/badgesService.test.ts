import { badgesService } from '../badgesService';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [{ id: '1', title: 'Badge 1' }], error: null })),
        eq: jest.fn(() => Promise.resolve({ data: [{ id: 'eb1', badge_id: '1' }], error: null })),
      })),
    })),
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: { newlyUnlocked: [{ id: '2', title: 'Badge 2' }] }, error: null })),
    },
  },
}));

describe('badgesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all badges', async () => {
    const badges = await badgesService.getAllBadges();
    expect(badges).toHaveLength(1);
    expect(badges[0].title).toBe('Badge 1');
    expect(supabase.from).toHaveBeenCalledWith('badges');
  });

  it('should fetch earned badges for a profile', async () => {
    const earned = await badgesService.getEarnedBadges('profile-123');
    expect(earned).toHaveLength(1);
    expect(earned[0].badge_id).toBe('1');
    expect(supabase.from).toHaveBeenCalledWith('kid_badges');
  });

  it('should evaluate badges via edge function', async () => {
    const result = await badgesService.evaluateBadges('profile-123');
    expect(result.newlyUnlocked).toHaveLength(1);
    expect(result.newlyUnlocked[0].title).toBe('Badge 2');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('badge-evaluator', {
      body: { profileId: 'profile-123' },
    });
  });

  it('should handle error when fetching badges', async () => {
    // Override the mock for this specific test
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Network Error' } })),
      })),
    });

    await expect(badgesService.getAllBadges()).rejects.toThrow();
  });

  it('should handle edge function failure gracefully', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Function error' },
    });

    const result = await badgesService.evaluateBadges('profile-123');
    expect(result.newlyUnlocked).toEqual([]);
  });

  it('should handle exception during evaluateBadges gracefully', async () => {
    (supabase.functions.invoke as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    const result = await badgesService.evaluateBadges('profile-123');
    expect(result.newlyUnlocked).toEqual([]);
  });
});
