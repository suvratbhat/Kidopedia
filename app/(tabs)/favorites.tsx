import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { WordCard } from '../../components/WordCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { profileService } from '@/services/profileService';
import { databaseService } from '../../services/databaseService';
import { useProfile } from '@/contexts/ProfileContext';
import { CachedWord } from '../../types/dictionary';
import { Heart } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { activeProfile, theme } = useProfile();
  const [favorites, setFavorites] = useState<CachedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [activeProfile])
  );

  const loadFavorites = async () => {
    if (!activeProfile) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const favoriteProgress = await profileService.getFavoriteWords(activeProfile.id);

      const wordsPromises = favoriteProgress.map(async (progress) => {
        return await databaseService.getWordDetails(progress.word);
      });

      const words = await Promise.all(wordsPromises);
      const validWords = words.filter((w): w is CachedWord => w !== null);

      setFavorites(validWords);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordPress = (word: CachedWord) => {
    router.push(`/word/${encodeURIComponent(word.word)}`);
  };

  const getFirstDefinition = (meanings: any[]): string => {
    if (meanings.length === 0) return 'No definition available';
    return meanings[0].definitions[0]?.definition || 'No definition available';
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading favorites..." />;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.primary,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'word' : 'words'} saved
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WordCard
            word={item.word}
            meaning={getFirstDefinition(item.meanings)}
            difficulty="easy"
            onPress={() => handleWordPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Favorites Yet"
            message="Tap the heart icon on any word to add it to your favorites!"
            icon={<Heart size={80} color="#CCCCCC" />}
          />
        }
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.95,
  },
  emptyList: {
    flex: 1,
  },
});
