import { customWordsService } from '../customWordsService';
import { supabase } from '../../../lib/supabase';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: '1', word: 'test' }, error: null })),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [{ id: '1', word: 'test' }], error: null })),
          maybeSingle: jest.fn(() => Promise.resolve({ data: { id: '1', word: 'test' }, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('CustomWordsService', () => {
  const profileId = 'profile-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a custom word', async () => {
    const result = await customWordsService.addCustomWord(profileId, 'Test', 'A trial');
    expect(result).toEqual({ id: '1', word: 'test' });
    expect(supabase.from).toHaveBeenCalledWith('custom_words');
  });

  it('should get custom words for a profile', async () => {
    const result = await customWordsService.getCustomWords(profileId);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('test');
  });

  it('should delete a custom word', async () => {
    const result = await customWordsService.deleteCustomWord('1');
    expect(result).toBe(true);
  });

  it('should handle errors when adding a word', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } })),
        })),
      })),
    }));

    const result = await customWordsService.addCustomWord(profileId, 'Fail', 'Bad');
    expect(result).toBeNull();
  });

  it('should map CustomWord to CachedWord', () => {
    const customWord = {
      id: '1',
      profile_id: profileId,
      word: 'test',
      definition: 'a trial',
      example: 'this is a test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const cachedWord = customWordsService.mapToCachedWord(customWord);
    expect(cachedWord.word).toBe('test');
    expect(cachedWord.meanings[0].partOfSpeech).toBe('Added by you');
    expect(cachedWord.meanings[0].definitions[0].definition).toBe('a trial');
    expect(cachedWord.meanings[0].definitions[0].example).toBe('this is a test');
  });
});
