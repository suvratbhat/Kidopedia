import AsyncStorage from '@react-native-async-storage/async-storage';
import { sqliteService } from './sqliteService';
import { CachedWord } from '@/types/dictionary';

class OfflineStorageService {
  private STORAGE_PREFIX = '@kidopedia_';

  // ── AsyncStorage-backed (legacy) ─────────────────────────────────────────────

  async saveSearchHistory(word: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const updatedHistory = [word, ...history.filter((w) => w !== word)].slice(0, 20);
      await AsyncStorage.setItem(
        `${this.STORAGE_PREFIX}search_history`,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const history = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}search_history`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_PREFIX}search_history`);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  async saveCachedWord(word: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.STORAGE_PREFIX}word_${word}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching word:', error);
    }
  }

  async saveAppData(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving app data:', error);
    }
  }

  async getAppData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting app data:', error);
      return null;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const kidopediaKeys = keys.filter((key) => key.startsWith(this.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(kidopediaKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // ── SQLite-backed (primary word store) ──────────────────────────────────────

  async getCachedWord(word: string): Promise<CachedWord | null> {
    return sqliteService.getWord(word);
  }

  async cacheWord(wordData: CachedWord): Promise<void> {
    await sqliteService.upsertWord(wordData);
  }

  async searchCachedWords(query: string, limit: number = 20): Promise<CachedWord[]> {
    return sqliteService.searchWords(query, limit);
  }

  async getAllCachedWords(): Promise<CachedWord[]> {
    return sqliteService.getAllCachedWords();
  }

  async getRandomCachedWord(): Promise<CachedWord | null> {
    return sqliteService.getRandomWord();
  }

  async getRecentSearches(profileId?: string): Promise<string[]> {
    return sqliteService.getRecentSearches(profileId ?? null, 20);
  }

  async addRecentSearch(word: string, profileId?: string): Promise<void> {
    await sqliteService.addRecentSearch(profileId ?? null, word);
  }
}

export const offlineStorageService = new OfflineStorageService();
