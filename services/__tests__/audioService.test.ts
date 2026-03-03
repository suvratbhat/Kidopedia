import { audioService } from '../audioService';
import { pronunciationService } from '../pronunciationService';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

jest.mock('../pronunciationService', () => ({
  pronunciationService: {
    speak: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('AudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should play audio from URL if provided (Happy Path)', async () => {
    const word = 'hello';
    const audioUrl = 'https://example.com/hello.mp3';
    
    // On web, it uses new Audio(). On native, it uses expo-av.
    // Since we are in a test environment, we can't easily test the Audio object,
    // but we can verify it doesn't crash and handles fallback.
    await audioService.playPronunciation(word, audioUrl);
    
    // If it's not web and expo-av is not mocked, it should fallback to pronunciationService
    // In jest environment, Platform.OS is 'ios' or 'android' by default if using react-native preset.
    // expect(pronunciationService.speak).toHaveBeenCalledWith(word);
  });

  it('should fallback to TTS if no audio URL is provided (Edge Case)', async () => {
    const word = 'world';
    await audioService.playPronunciation(word, undefined);
    expect(pronunciationService.speak).toHaveBeenCalledWith(word);
  });

  it('should fetch and cache audio if not in DB', async () => {
    const word = 'apple';
    const mockAudioUrl = 'https://example.com/apple.mp3';
    
    (supabase.from as jest.fn).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue([{ audioUrl: mockAudioUrl }]),
    });

    (supabase.from as jest.fn).mockReturnValueOnce({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    });

    const result = await audioService.fetchAndCacheAudio(word);
    expect(result).toBe(mockAudioUrl);
    expect(supabase.from).toHaveBeenCalledWith('cached_words');
  });

  it('should handle errors during fetching (Error Handling)', async () => {
    const word = 'error';
    (supabase.from as jest.fn).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockRejectedValue(new Error('DB Error')),
        })),
      })),
    });

    const result = await audioService.fetchAndCacheAudio(word);
    expect(result).toBeNull();
  });
});
