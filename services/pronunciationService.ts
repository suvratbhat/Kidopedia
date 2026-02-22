import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class PronunciationService {
  private enabled = true;
  private rate = 0.8;
  private pitch = 1.0;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  getRate(): number {
    return this.rate;
  }

  setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  getPitch(): number {
    return this.pitch;
  }

  async speak(text: string, language: string = 'en-US'): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      console.log('Speech disabled or not supported on web');
      return;
    }

    try {
      await Speech.stop();
      Speech.speak(text, {
        language,
        pitch: this.pitch,
        rate: this.rate,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking speech status:', error);
      return false;
    }
  }
}

export const pronunciationService = new PronunciationService();
