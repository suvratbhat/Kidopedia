import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun } from 'lucide-react-native';
import { CachedWord } from '../types/dictionary';

interface DailyWordCardProps {
  word: CachedWord;
  theme: any;
  onPress: (word: CachedWord) => void;
  definition: string;
}

export const DailyWordCard: React.FC<DailyWordCardProps> = ({ word, theme, onPress, definition }) => {
  return (
    <TouchableOpacity 
      onPress={() => onPress(word)}
      activeOpacity={0.9}
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.primary, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Sun size={20} color="#FFFFFF" />
          <Text style={styles.label}>WORD OF THE DAY</Text>
        </View>
        <Text style={styles.wordText}>{word.word}</Text>
        <Text style={styles.definition} numberOfLines={2}>
          {definition}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.tapToLearn}>Tap to learn more →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  wordText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  definition: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'flex-end',
  },
  tapToLearn: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
