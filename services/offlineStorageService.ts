import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineStorageService {
  private STORAGE_PREFIX = '@kidopedia_';

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

  async getCachedWord(word: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}word_${word}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached word:', error);
      return null;
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
}

export const offlineStorageService = new OfflineStorageService();
