import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from '../../components/SearchBar';
import { WordCard } from '../../components/WordCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CategoryCard } from '../../components/CategoryCard';
import { LevelBanner } from '../../components/LevelBanner';
import { AchievementBadge } from '../../components/AchievementBadge';
import { databaseService } from '../../services/databaseService';
import { offlineStorageService } from '../../services/offlineStorageService';
import { profileService } from '../../services/profileService';
import { contentFilterService } from '../../services/contentFilterService';
import { useProfile } from '@/contexts/ProfileContext';
import { CachedWord } from '../../types/dictionary';
import { Sparkles, Rocket, Heart, Apple, Zap, Gamepad2, User, AlertCircle } from 'lucide-react-native';

export default function SearchScreen() {
  const router = useRouter();
  const { activeProfile, theme } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CachedWord[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
  const [showContentBlockedMessage, setShowContentBlockedMessage] = useState(false);

  useEffect(() => {
    loadRecentSearches();
    loadProfileData();
  }, [activeProfile]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadProfileData = async () => {
    if (!activeProfile) return;

    try {
      const favorites = await profileService.getFavoriteWords(activeProfile.id);
      setFavoriteCount(favorites.length);

      const streak = await profileService.getDailyStreak(activeProfile.id);
      if (streak) {
        setStreakData({
          current: streak.streak_count,
          longest: streak.longest_streak,
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const recent = await offlineStorageService.getRecentSearches();
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsLoading(true);
      setShowContentBlockedMessage(false);

      const sanitized = contentFilterService.sanitizeSearchQuery(query, activeProfile?.age || 8);

      if (sanitized.isBlocked) {
        setShowContentBlockedMessage(true);
        setSearchResults([]);
        return;
      }

      const results = await databaseService.searchWords(query, 20);

      if (results.length === 0 && query.length > 2) {
        const wordCheck = contentFilterService.isWordAppropriate(query, activeProfile?.age || 8);
        if (!wordCheck.isAppropriate) {
          setShowContentBlockedMessage(true);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordPress = async (word: CachedWord) => {
    if (activeProfile) {
      await profileService.trackWordView(activeProfile.id, word.word);
    }
    await offlineStorageService.addRecentSearch(word.word);
    router.push(`/word/${encodeURIComponent(word.word)}`);
    await loadRecentSearches();
    await loadProfileData();
  };

  const handleRecentSearchPress = (word: string) => {
    setSearchQuery(word);
  };

  const handleRandomWord = async () => {
    try {
      const randomWord = await offlineStorageService.getRandomCachedWord();
      if (randomWord) {
        if (activeProfile) {
          await profileService.trackWordView(activeProfile.id, randomWord.word);
        }
        router.push(`/word/${encodeURIComponent(randomWord.word)}`);
      } else {
        const popularWords = await databaseService.getPopularWords(10);
        if (popularWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * popularWords.length);
          router.push(`/word/${encodeURIComponent(popularWords[randomIndex].word)}`);
        }
      }
    } catch (error) {
      console.error('Error getting random word:', error);
    }
  };

  const getFirstDefinition = (meanings: any[]): string => {
    if (meanings.length === 0) return 'No definition available';
    return meanings[0].definitions[0]?.definition || 'No definition available';
  };

  const categories = [
    { id: '1', title: 'Animals', icon: Heart, gradient: ['#FF6B9D', '#C44569'], words: 50, learned: 0 },
    { id: '2', title: 'Food', icon: Apple, gradient: ['#4ECDC4', '#44A08D'], words: 40, learned: 0 },
    { id: '3', title: 'Space', icon: Rocket, gradient: ['#667EEA', '#764BA2'], words: 35, learned: 0 },
    { id: '4', title: 'Sports', icon: Gamepad2, gradient: ['#FFA726', '#FB8C00'], words: 45, learned: 0 },
  ];

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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    randomButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      borderRadius: 20,
      padding: 20,
      gap: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hi {activeProfile?.name}!</Text>
          <Text style={styles.subtitle}>Let's learn something awesome!</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: activeProfile?.avatar_color }]}
          onPress={() => router.push('/profiles')}
        >
          <Text style={styles.profileInitial}>
            {activeProfile?.name.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="Search for a word..."
      />

      {searchQuery.length === 0 ? (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <LevelBanner
              level={activeProfile?.current_level || 1}
              title="Word Explorer"
              nextLevelWords={Math.max(0, (((activeProfile?.current_level || 1) * 100) - (activeProfile?.total_xp || 0)))}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsRow}>
              <AchievementBadge
                type="trophy"
                count={activeProfile?.words_learned || 0}
                label="Words Learned"
                gradient={[theme.primary, theme.secondary]}
              />
              <AchievementBadge
                type="star"
                count={favoriteCount}
                label="Favorites"
                gradient={['#42A5F5', '#1E88E5']}
              />
              <AchievementBadge
                type="award"
                count={streakData.current}
                label="Day Streak"
                gradient={['#66BB6A', '#43A047']}
              />
              <AchievementBadge
                type="target"
                count={activeProfile?.total_xp || 0}
                label="Total XP"
                gradient={[theme.accent, theme.primary]}
              />
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  title={category.title}
                  icon={category.icon}
                  gradient={category.gradient}
                  wordCount={category.words}
                  learned={category.learned}
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={dynamicStyles.randomButton} onPress={handleRandomWord}>
              <Zap size={28} color="#FFFFFF" fill="#FFFFFF" />
              <View style={styles.randomButtonText}>
                <Text style={styles.randomTitle}>Surprise Me!</Text>
                <Text style={styles.randomSubtitle}>Learn a random word</Text>
              </View>
            </TouchableOpacity>
          </View>

          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.slice(0, 5).map((word, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleRecentSearchPress(word)}
                >
                  <Text style={styles.recentText}>{word}</Text>
                  <Sparkles size={16} color={theme.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WordCard
              word={item.word}
              definition={getFirstDefinition(item.meanings)}
              onPress={() => handleWordPress(item)}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <LoadingSpinner message="Searching..." />
            ) : showContentBlockedMessage ? (
              <View style={styles.emptySearchContainer}>
                <AlertCircle size={64} color="#F59E0B" />
                <Text style={styles.emptySearchTitle}>
                  {contentFilterService.getBlockedMessage(activeProfile?.age || 8)}
                </Text>
                <Text style={styles.emptySearchMessage}>
                  Try searching for fun words like "elephant", "rainbow", or "adventure"!
                </Text>
              </View>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchTitle}>No cached results for "{searchQuery}"</Text>
                <Text style={styles.emptySearchMessage}>
                  But don't worry! Tap below to look it up in the dictionary.
                </Text>
                <TouchableOpacity
                  style={[styles.lookupButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    router.push(`/word/${encodeURIComponent(searchQuery.toLowerCase())}`);
                  }}
                >
                  <Text style={styles.lookupButtonText}>Look Up "{searchQuery}"</Text>
                </TouchableOpacity>
              </View>
            )
          }
          contentContainerStyle={searchResults.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: {
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
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 16,
  },
  achievementsRow: {
    flexDirection: 'row',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  randomButtonText: {
    alignItems: 'flex-start',
  },
  randomTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  randomSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyList: {
    flex: 1,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySearchMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  lookupButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lookupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
