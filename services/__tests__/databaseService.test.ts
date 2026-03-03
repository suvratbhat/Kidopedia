import { databaseService } from '../databaseService';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('DatabaseService - Daily Word', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDailyWord returns a word when found', async () => {
    const mockWord = {
      id: 'word-123',
      word: 'adventure',
      complexity_level: 5,
    };

    const mockResponse = {
      data: {
        id: 'daily-123',
        complexity_level: 5,
        display_date: new Date().toISOString().split('T')[0],
        cached_words: mockWord,
      },
      error: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await databaseService.getDailyWord(5);
    expect(result).toEqual(mockWord);
    expect(supabase.from).toHaveBeenCalledWith('daily_words');
  });

  test('getDailyWord returns null when no word is found', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const result = await databaseService.getDailyWord(5);
    expect(result).toBeNull();
  });

  test('getDailyWord handles database errors', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    });

    const result = await databaseService.getDailyWord(5);
    expect(result).toBeNull();
  });
});
