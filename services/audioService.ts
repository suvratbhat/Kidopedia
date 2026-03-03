import { Platform } from 'react-native';
import { pronunciationService } from './pronunciationService';
import { supabase } from '../lib/supabase';

class AudioService {
  private audio: any = null;

  async playPronunciation(word: string, audioUrl?: string): Promise<void> {
    if (!audioUrl) {
      console.log('No audio URL provided, falling back to TTS');
      return pronunciationService.speak(word);
    }

    try {
      if (Platform.OS === 'web') {
        if (this.audio) {
          this.audio.pause();
        }
        this.audio = new Audio(audioUrl);
        await this.audio.play();
      } else {
        // For native, since expo-av might not be installed, 
        // we try to use it if available, otherwise fallback to expo-speech
        try {
          const { Audio } = require('expo-av');
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          // Auto unload when finished
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (e) {
          console.log('expo-av not available, falling back to expo-speech');
          await pronunciationService.speak(word);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      // Final fallback
      await pronunciationService.speak(word);
    }
  }

  async fetchAndCacheAudio(word: string): Promise<string | null> {
    try {
      // 1. Check if already in DB
      const { data, error } = await supabase
        .from('cached_words')
        .select('audio_url')
        .eq('word', word.toLowerCase())
        .maybeSingle();

      if (data?.audio_url) {
        return data.audio_url;
      }

      // 2. If not, call edge function to fetch/generate
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fetch-dictionary?word=${encodeURIComponent(word)}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const dictionaryData = await response.json();
      const newAudioUrl = dictionaryData[0]?.audioUrl;

      if (newAudioUrl) {
        // Update DB
        await supabase.rpc('update_word_audio_url', {
          word_val: word.toLowerCase(),
          audio_url_val: newAudioUrl,
        });
        
        return newAudioUrl;
      }

      return null;
    } catch (error) {
      console.error('Error fetching/caching audio:', error);
      return null;
    }
  }
}

export const audioService = new AudioService();
