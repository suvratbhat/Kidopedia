import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Volume2, Heart, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { databaseService } from '../../services/databaseService';
import { profileService } from '@/services/profileService';
import { pronunciationService } from '../../services/pronunciationService';
import { contentFilterService } from '../../services/contentFilterService';
import { useProfile } from '@/contexts/ProfileContext';
import { CachedWord } from '../../types/dictionary';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeProfile } = useProfile();
  const [word, setWord] = useState<CachedWord | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadWord();
  }, [id, activeProfile]);

  const loadWord = async () => {
    try {
      if (!id) return;

      const decodedWord = decodeURIComponent(id);
      const wordData = await databaseService.getWordDetails(decodedWord);
      setWord(wordData);

      if (wordData && activeProfile) {
        await profileService.trackWordView(activeProfile.id, wordData.word);
        const progress = await profileService.getWordProgress(activeProfile.id);
        const wordProgress = progress.find(p => p.word === wordData.word);
        setIsFavorite(wordProgress?.is_favorite || false);
      }
    } catch (error) {
      console.error('Error loading word:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePronounce = async () => {
    if (!word || isSpeaking) return;

    try {
      setIsSpeaking(true);
      await pronunciationService.speak(word.word, 'en-US');
    } catch (error) {
      console.error('Pronunciation error:', error);
    } finally {
      setTimeout(() => setIsSpeaking(false), 1000);
    }
  };

  const handleToggleFavorite = async () => {
    if (!word || !activeProfile) return;

    try {
      const newFavoriteState = await profileService.toggleFavorite(activeProfile.id, word.word);
      setIsFavorite(newFavoriteState);

      if (newFavoriteState) {
        await profileService.addXP(activeProfile.id, 5);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading word..." />;
  }

  if (!word) {
    const searchWord = id ? decodeURIComponent(id) : '';
    const wordCheck = contentFilterService.isWordAppropriate(searchWord, activeProfile?.age || 8);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          {!wordCheck.isAppropriate ? (
            <>
              <AlertCircle size={64} color="#F59E0B" />
              <Text style={styles.errorTitle}>
                {contentFilterService.getBlockedMessage(activeProfile?.age || 8)}
              </Text>
              <Text style={styles.errorMessage}>
                Try searching for fun words like "elephant", "rainbow", or "adventure"!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.errorTitle}>Word Not Found</Text>
              <Text style={styles.errorMessage}>
                We couldn't find this word in the dictionary. This might be because:
              </Text>
              <Text style={styles.errorBullet}>• The word doesn't exist</Text>
              <Text style={styles.errorBullet}>• It might be misspelled</Text>
              <Text style={styles.errorBullet}>• No internet connection to fetch new words</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.backToSearchButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToSearchText}>Try Another Word</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Heart size={24} color="#FFFFFF" fill={isFavorite ? '#FFFFFF' : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.wordSection}>
          <View style={styles.wordHeader}>
            <Text style={styles.word}>{word.word}</Text>
          </View>

          {word.phonetic && <Text style={styles.phonetic}>{word.phonetic}</Text>}

          <TouchableOpacity
            style={[styles.pronounceButton, isSpeaking && styles.pronounceButtonActive]}
            onPress={handlePronounce}
            disabled={isSpeaking}
          >
            <Volume2 size={24} color="#FFFFFF" />
            <Text style={styles.pronounceText}>
              {isSpeaking ? 'Speaking...' : 'Pronounce'}
            </Text>
          </TouchableOpacity>
        </View>

        {(word.kannada_translation || word.hindi_translation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Translations</Text>
            {word.kannada_translation && (
              <View style={styles.translationRow}>
                <Text style={styles.translationLabel}>Kannada:</Text>
                <Text style={styles.translationText}>{word.kannada_translation}</Text>
              </View>
            )}
            {word.hindi_translation && (
              <View style={styles.translationRow}>
                <Text style={styles.translationLabel}>Hindi:</Text>
                <Text style={styles.translationText}>{word.hindi_translation}</Text>
              </View>
            )}
          </View>
        )}

        {word.origin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Origin</Text>
            <Text style={styles.originText}>{word.origin}</Text>
          </View>
        )}

        {word.meanings.map((meaning, meaningIndex) => (
          <View key={meaningIndex} style={styles.meaningSection}>
            <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>

            {meaning.definitions.map((definition, defIndex) => (
              <View key={defIndex} style={styles.definitionContainer}>
                <View style={styles.definitionHeader}>
                  <View style={styles.bullet} />
                  <View style={styles.definitionContent}>
                    <Text style={styles.definition}>{definition.definition}</Text>

                    {definition.example && (
                      <Text style={styles.example}>"{definition.example}"</Text>
                    )}

                    {definition.synonyms && definition.synonyms.length > 0 && (
                      <View style={styles.wordListContainer}>
                        <Text style={styles.wordListLabel}>Synonyms:</Text>
                        <Text style={styles.wordListText}>{definition.synonyms.join(', ')}</Text>
                      </View>
                    )}

                    {definition.antonyms && definition.antonyms.length > 0 && (
                      <View style={styles.wordListContainer}>
                        <Text style={styles.wordListLabel}>Antonyms:</Text>
                        <Text style={styles.wordListText}>{definition.antonyms.join(', ')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  wordSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wordHeader: {
    marginBottom: 8,
  },
  word: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    textTransform: 'capitalize',
  },
  phonetic: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  pronounceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  pronounceButtonActive: {
    backgroundColor: '#95E1D3',
  },
  pronounceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  originText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  translationRow: {
    marginBottom: 12,
  },
  translationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
  },
  meaningSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  partOfSpeech: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  definitionContainer: {
    marginBottom: 16,
  },
  definitionHeader: {
    flexDirection: 'row',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
    marginTop: 6,
    marginRight: 12,
  },
  definitionContent: {
    flex: 1,
  },
  definition: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  example: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  wordListContainer: {
    marginTop: 8,
  },
  wordListLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  wordListText: {
    fontSize: 14,
    color: '#4ECDC4',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorBullet: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    width: '100%',
  },
  backToSearchButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  backToSearchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
