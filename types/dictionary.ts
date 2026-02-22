export interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface CachedWord {
  id: string;
  word: string;
  phonetic: string;
  audio_url: string;
  meanings: Meaning[];
  origin: string;
  kannada_translation?: string;
  hindi_translation?: string;
  search_count: number;
  created_at: string;
  updated_at: string;
  is_age_appropriate?: boolean;
  min_age?: number;
  content_flags?: string[];
  complexity_level?: number;
}

export interface DictionaryAPIResponse {
  word: string;
  phonetic: string;
  audioUrl: string;
  meanings: Meaning[];
  origin: string;
  kannadaTranslation?: string;
  hindiTranslation?: string;
}

export interface UserPreferences {
  pronunciationSpeed: number;
  preferredLanguages: ('en' | 'kn' | 'hi')[];
  notificationsEnabled: boolean;
  lastSyncDate?: string;
  deviceId: string;
}

export interface FavoriteWord {
  wordId: string;
  word: string;
  addedAt: string;
}

export interface SearchHistory {
  word: string;
  searchedAt: string;
}
