import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { audioService } from '../services/audioService';

interface PronounceButtonProps {
  word: string;
  audioUrl?: string;
  size?: number;
  showText?: boolean;
}

export const PronounceButton: React.FC<PronounceButtonProps> = ({
  word,
  audioUrl: initialAudioUrl,
  size = 24,
  showText = true,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(initialAudioUrl);

  const handlePress = async () => {
    if (isSpeaking) return;

    try {
      setIsSpeaking(true);
      
      let urlToPlay = currentAudioUrl;
      
      // If no URL, try to fetch/cache it first
      if (!urlToPlay) {
        urlToPlay = await audioService.fetchAndCacheAudio(word) || undefined;
        if (urlToPlay) {
          setCurrentAudioUrl(urlToPlay);
        }
      }

      await audioService.playPronunciation(word, urlToPlay);
    } catch (error) {
      console.error('Error in PronounceButton:', error);
    } finally {
      // Small delay to show the "speaking" state
      setTimeout(() => setIsSpeaking(false), 1000);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isSpeaking && styles.buttonActive]}
      onPress={handlePress}
      disabled={isSpeaking}
    >
      {isSpeaking ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Volume2 size={size} color="#FFFFFF" />
      )}
      {showText && (
        <Text style={styles.text}>
          {isSpeaking ? 'Speaking...' : 'Pronounce'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
    minWidth: 150,
  },
  buttonActive: {
    backgroundColor: '#95E1D3',
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
