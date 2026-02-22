import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useProfile } from '@/contexts/ProfileContext';

interface WordCardProps {
  word: string;
  definition: string;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function WordCard({
  word,
  definition,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: WordCardProps) {
  const { theme } = useProfile();

  const handleSpeak = (e: any) => {
    e.stopPropagation();
    Speech.speak(word, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.wordContainer}>
          <Text style={[styles.word, { color: theme.primary }]}>{word}</Text>
          <TouchableOpacity onPress={handleSpeak} style={styles.iconButton}>
            <Volume2 size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        {onToggleFavorite && (
          <TouchableOpacity onPress={handleFavorite} style={styles.iconButton}>
            <Heart
              size={20}
              color={isFavorite ? theme.accent : theme.textSecondary}
              fill={isFavorite ? theme.accent : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.definition, { color: theme.text }]} numberOfLines={2}>
        {definition}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  word: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  definition: {
    fontSize: 14,
    lineHeight: 20,
  },
  iconButton: {
    padding: 4,
  },
});
