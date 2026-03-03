import { supabase } from '../../lib/supabase';
import { CachedWord, Meaning } from '../../types/dictionary';

export interface CustomWord {
  id: string;
  profile_id: string;
  word: string;
  definition: string;
  example?: string;
  created_at: string;
  updated_at: string;
}

export class CustomWordsService {
  async addCustomWord(profileId: string, word: string, definition: string, example?: string): Promise<CustomWord | null> {
    const { data, error } = await supabase
      .from('custom_words')
      .insert([
        {
          profile_id: profileId,
          word: word.toLowerCase().trim(),
          definition: definition.trim(),
          example: example?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding custom word:', error);
      return null;
    }

    return data;
  }

  async getCustomWords(profileId: string): Promise<CustomWord[]> {
    const { data, error } = await supabase
      .from('custom_words')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom words:', error);
      return [];
    }

    return data || [];
  }

  async deleteCustomWord(wordId: string): Promise<boolean> {
    const { error } = await supabase
      .from('custom_words')
      .delete()
      .eq('id', wordId);

    if (error) {
      console.error('Error deleting custom word:', error);
      return false;
    }

    return true;
  }

  async getCustomWordByText(profileId: string, word: string): Promise<CustomWord | null> {
    const { data, error } = await supabase
      .from('custom_words')
      .select('*')
      .eq('profile_id', profileId)
      .eq('word', word.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Error fetching custom word by text:', error);
      return null;
    }

    return data;
  }

  mapToCachedWord(customWord: CustomWord): CachedWord {
    const meaning: Meaning = {
      partOfSpeech: 'Added by you',
      definitions: [
        {
          definition: customWord.definition,
          example: customWord.example || undefined,
        },
      ],
    };

    return {
      id: customWord.id,
      word: customWord.word,
      phonetic: '',
      audio_url: '',
      meanings: [meaning],
      origin: 'Custom word',
      search_count: 0,
      created_at: customWord.created_at,
      updated_at: customWord.updated_at,
      is_age_appropriate: true,
      min_age: 0,
    };
  }
}

export const customWordsService = new CustomWordsService();
