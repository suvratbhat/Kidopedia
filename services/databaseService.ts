import { supabase } from '../lib/supabase';
import { CachedWord, DictionaryAPIResponse } from '../types/dictionary';
import { offlineStorageService } from './offlineStorageService';
import { COMMON_WORDS } from './commonWords';
import { contentFilterService } from './contentFilterService';

export class DatabaseService {
  private currentProfileAge: number = 8;

  setProfileAge(age: number): void {
    this.currentProfileAge = age;
  }

  private async fetchFromDictionaryAPI(word: string): Promise<DictionaryAPIResponse[] | null> {
    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fetch-dictionary?word=${encodeURIComponent(word)}`;

      console.log('🔍 Fetching word from API:', word);
      console.log('📍 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ Word not found in dictionary API');
          return null;
        }
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response data received:', JSON.stringify(data).substring(0, 200));
      console.log('✅ Translations - Kannada:', data[0]?.kannadaTranslation, 'Hindi:', data[0]?.hindiTranslation);
      return data;
    } catch (error) {
      console.error('❌ Error fetching from dictionary API:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }

  async getCachedWordFromDB(word: string): Promise<CachedWord | null> {
    const { data, error } = await supabase
      .from('cached_words')
      .select('*')
      .eq('word', word.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error fetching cached word from DB:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Apply age-based filtering to meanings
    const filteredMeanings = contentFilterService.filterMeanings(data.meanings, this.currentProfileAge);

    // If all meanings are filtered out, return null (word not appropriate)
    if (filteredMeanings.length === 0 && data.meanings.length > 0) {
      return null;
    }

    return {
      ...data,
      meanings: filteredMeanings
    };
  }

  async cacheWordInDB(wordData: DictionaryAPIResponse): Promise<CachedWord | null> {
    console.log('💾 Caching word in DB:', wordData.word);
    console.log('📝 Translations - Kannada:', wordData.kannadaTranslation, 'Hindi:', wordData.hindiTranslation);

    const wordCheck = contentFilterService.isWordAppropriate(wordData.word, this.currentProfileAge);

    const contentFlags: string[] = [];
    let isAppropriate = wordCheck.isAppropriate;
    let minAge = 2;
    let complexityLevel = 5;

    if (!wordCheck.isAppropriate) {
      contentFlags.push(wordCheck.reason || 'inappropriate');
      minAge = 16;
      isAppropriate = false;
    }

    // Filter meanings to remove inappropriate definitions and examples
    const filteredMeanings = contentFilterService.filterMeanings(wordData.meanings, this.currentProfileAge);

    // If all meanings were filtered out, mark as inappropriate
    if (filteredMeanings.length === 0 && wordData.meanings.length > 0) {
      isAppropriate = false;
      minAge = 16;
      contentFlags.push('All definitions contain inappropriate content');
    }

    const { data, error } = await supabase
      .from('cached_words')
      .upsert({
        word: wordData.word.toLowerCase(),
        phonetic: wordData.phonetic,
        audio_url: wordData.audioUrl,
        meanings: filteredMeanings,
        origin: wordData.origin,
        kannada_translation: wordData.kannadaTranslation || '',
        hindi_translation: wordData.hindiTranslation || '',
        is_age_appropriate: isAppropriate,
        min_age: minAge,
        content_flags: contentFlags,
        complexity_level: complexityLevel,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'word',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('❌ Error caching word in DB:', error);
      return null;
    }

    console.log('✅ Word cached in DB successfully');
    return data;
  }

  async incrementSearchCount(word: string): Promise<void> {
    const { error } = await supabase
      .rpc('increment_word_search_count', { word_text: word.toLowerCase() });

    if (error) {
      console.error('Error incrementing search count:', error);
    }
  }

  async searchWords(query: string, limit: number = 20): Promise<CachedWord[]> {
    const sanitized = contentFilterService.sanitizeSearchQuery(query, this.currentProfileAge);

    if (sanitized.isBlocked || !sanitized.sanitized) {
      console.log('Search query blocked:', query);
      return [];
    }

    const searchQuery = sanitized.sanitized;

    const cachedResults = await offlineStorageService.searchCachedWords(searchQuery, limit);
    if (cachedResults.length > 0) {
      return this.filterWordsByAge(cachedResults);
    }

    const { data, error } = await supabase
      .from('cached_words')
      .select('*')
      .ilike('word', `${searchQuery.toLowerCase()}%`)
      .lte('min_age', this.currentProfileAge)
      .eq('is_age_appropriate', true)
      .order('search_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching words:', error);
      return [];
    }

    if (data && data.length > 0) {
      for (const word of data) {
        await offlineStorageService.cacheWord(word);
      }
    }

    return data || [];
  }

  private filterWordsByAge(words: CachedWord[]): CachedWord[] {
    return words.filter(word => {
      if (word.min_age && word.min_age > this.currentProfileAge) {
        return false;
      }
      if (word.is_age_appropriate === false) {
        return false;
      }
      return true;
    });
  }

  async getWordDetails(word: string): Promise<CachedWord | null> {
    console.log('🔎 getWordDetails called for:', word);

    const wordCheck = contentFilterService.isWordAppropriate(word, this.currentProfileAge);
    if (!wordCheck.isAppropriate) {
      console.log('🚫 Word blocked by content filter:', word);
      return null;
    }

    const localCache = await offlineStorageService.getCachedWord(word);
    if (localCache) {
      console.log('✅ Found in local cache');
      if (this.isWordAgeAppropriate(localCache)) {
        return localCache;
      } else {
        console.log('⚠️ Word in cache but not age-appropriate');
        return null;
      }
    }

    console.log('💾 Not in local cache, checking database');
    let dbCache = await this.getCachedWordFromDB(word);
    if (dbCache) {
      console.log('✅ Found in database cache');
      if (!this.isWordAgeAppropriate(dbCache)) {
        console.log('⚠️ Word not age-appropriate:', word);
        return null;
      }
      await offlineStorageService.cacheWord(dbCache);
      await this.incrementSearchCount(word);
      return dbCache;
    }

    console.log('🌐 Not in database, fetching from API');
    const apiData = await this.fetchFromDictionaryAPI(word);
    if (!apiData || apiData.length === 0) {
      console.log('❌ Word not found from API');
      return null;
    }

    console.log('💾 Word found from API, caching to database...');
    const firstEntry = apiData[0];
    dbCache = await this.cacheWordInDB(firstEntry);

    if (dbCache) {
      if (!this.isWordAgeAppropriate(dbCache)) {
        console.log('⚠️ Word cached but not age-appropriate:', word);
        return null;
      }
      await offlineStorageService.cacheWord(dbCache);
      console.log('✅ Word cached successfully, returning data');
      return dbCache;
    }

    console.log('❌ Failed to cache word');
    return null;
  }

  private isWordAgeAppropriate(word: CachedWord): boolean {
    if (word.is_age_appropriate === false) {
      return false;
    }
    if (word.min_age && word.min_age > this.currentProfileAge) {
      return false;
    }
    return true;
  }

  async getPopularWords(limit: number = 20): Promise<CachedWord[]> {
    const { data, error } = await supabase
      .from('cached_words')
      .select('*')
      .lte('min_age', this.currentProfileAge)
      .eq('is_age_appropriate', true)
      .order('search_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular words:', error);
      return [];
    }

    return data || [];
  }

  async getRecentWords(limit: number = 20): Promise<CachedWord[]> {
    const { data, error } = await supabase
      .from('cached_words')
      .select('*')
      .lte('min_age', this.currentProfileAge)
      .eq('is_age_appropriate', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent words:', error);
      return [];
    }

    return data || [];
  }

  async getCommonWords(limit: number = 10000): Promise<string[]> {
    try {
      // Exclude very basic words that kids already know
      const excludeWords = new Set([
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
        'this', 'that', 'these', 'those',
        'a', 'an', 'the',
        'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over',
        'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'so', 'than',
        'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
        'may', 'might', 'must', 'can', 'could',
        'not', 'no', 'yes', 'ok', 'okay',
      ]);

      const filteredWords = COMMON_WORDS.filter(word => !excludeWords.has(word.toLowerCase()));
      return filteredWords.slice(0, Math.min(limit, filteredWords.length));
    } catch (error) {
      console.error('Error in getCommonWords:', error);
      return [];
    }
  }

  async searchWord(word: string): Promise<CachedWord | null> {
    return this.getWordDetails(word);
  }
}

export const databaseService = new DatabaseService();
