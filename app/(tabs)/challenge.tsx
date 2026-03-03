import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, Flame, Trophy, RefreshCw } from 'lucide-react-native';
import { useProfile } from '@/contexts/ProfileContext';
import { challengeService, DailyChallenge, ChallengeWord } from '../../services/challengeService';
import { StreakBadge } from '../../components/StreakBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

type QuizPhase = 'loading' | 'quiz' | 'complete' | 'error';

export default function ChallengeScreen() {
  const { activeProfile, theme } = useProfile();

  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadChallenge = useCallback(async () => {
    if (!activeProfile) return;
    setPhase('loading');
    setCurrentWordIndex(0);
    setSelectedOption(null);
    setShowResult(false);

    try {
      const c = await challengeService.getTodayChallenge(activeProfile.id, activeProfile.age);
      setChallenge(c);

      if (c.words.length === 0) {
        setErrorMsg('No words available for today\'s challenge. Try syncing more words!');
        setPhase('error');
        return;
      }

      if (c.completed) {
        setPhase('complete');
        return;
      }

      // Resume from where the kid left off
      const answeredCount = Object.keys(c.answersGiven).length;
      setCurrentWordIndex(Math.min(answeredCount, c.words.length - 1));
      setPhase('quiz');
    } catch (e) {
      console.error('Challenge load error:', e);
      setErrorMsg('Could not load today\'s challenge. Please try again.');
      setPhase('error');
    }
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      loadChallenge();
    }, [loadChallenge]),
  );

  const handleOptionSelect = async (optionIndex: number) => {
    if (!challenge || selectedOption !== null) return; // already answered this word

    setSelectedOption(optionIndex);
    setShowResult(true);

    const currentWord = challenge.words[currentWordIndex];
    const updated = await challengeService.submitAnswer(challenge, currentWord.word, optionIndex);
    setChallenge(updated);

    if (updated.completed) {
      // Short delay so kid can see the result before the completion screen
      setTimeout(() => setPhase('complete'), 1200);
    }
  };

  const handleNextWord = () => {
    if (!challenge) return;
    const nextIndex = currentWordIndex + 1;
    if (nextIndex < challenge.words.length) {
      setCurrentWordIndex(nextIndex);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const currentWord: ChallengeWord | undefined = challenge?.words[currentWordIndex];
  const correctCount = challenge
    ? Object.values(challenge.answersGiven).filter(Boolean).length
    : 0;
  const totalWords = challenge?.words.length ?? 3;

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderProgressDots = () => (
    <View style={styles.progressDots}>
      {Array.from({ length: totalWords }).map((_, i) => {
        const wordForDot = challenge?.words[i];
        const answered = wordForDot ? wordForDot.word in (challenge?.answersGiven ?? {}) : false;
        const correct = answered && challenge?.answersGiven[wordForDot!.word];
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: answered
                  ? correct
                    ? theme.success
                    : theme.error
                  : i === currentWordIndex
                  ? theme.primary
                  : theme.border,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const renderOptionButton = (option: string, index: number) => {
    if (!currentWord) return null;
    const isSelected = selectedOption === index;
    const isCorrect = index === currentWord.correctIndex;

    let bg = theme.surface;
    let borderColor = theme.border;
    let textColor = theme.text;

    if (showResult && isSelected) {
      bg = isCorrect ? '#D1FAE5' : '#FEE2E2';
      borderColor = isCorrect ? theme.success : theme.error;
      textColor = isCorrect ? '#065F46' : '#991B1B';
    } else if (showResult && isCorrect) {
      bg = '#D1FAE5';
      borderColor = theme.success;
      textColor = '#065F46';
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.optionButton, { backgroundColor: bg, borderColor }]}
        onPress={() => handleOptionSelect(index)}
        disabled={showResult}
        activeOpacity={0.8}
        testID={`option-${index}`}
      >
        <View style={styles.optionRow}>
          <Text style={[styles.optionLetter, { color: borderColor }]}>
            {['A', 'B', 'C', 'D'][index]}
          </Text>
          <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
          {showResult && isCorrect && (
            <CheckCircle size={20} color={theme.success} />
          )}
          {showResult && isSelected && !isCorrect && (
            <XCircle size={20} color={theme.error} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Phases ───────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <LoadingSpinner message="Loading today's challenge..." />
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Oops!</Text>
        <Text style={[styles.errorMsg, { color: theme.textSecondary }]}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadChallenge}
        >
          <RefreshCw size={18} color="#FFF" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'complete' && challenge) {
    const allCorrect = correctCount === totalWords;
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.completionContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={allCorrect ? [theme.primary, theme.secondary] : [theme.accent, theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.completionHero}
        >
          <Text style={styles.completionEmoji}>{allCorrect ? '🏆' : '🌟'}</Text>
          <Text style={styles.completionTitle}>
            {allCorrect ? 'Perfect Score!' : 'Challenge Complete!'}
          </Text>
          <Text style={styles.completionSubtitle}>
            {allCorrect
              ? 'You got all 3 words right! Amazing!'
              : `You got ${correctCount} out of ${totalWords} words right!`}
          </Text>
        </LinearGradient>

        <View style={styles.badgesRow}>
          <StreakBadge
            count={correctCount}
            label="Correct"
            variant="star"
            large
          />
          {allCorrect && (
            <StreakBadge
              count={1}
              label="Streak +1"
              variant="flame"
              large
            />
          )}
          {challenge.badgeUnlocked && (
            <StreakBadge
              count={1}
              label="Badge!"
              variant="trophy"
              large
            />
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Word Review</Text>
          {challenge.words.map((w) => {
            const wasCorrect = challenge.answersGiven[w.word];
            return (
              <View
                key={w.word}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: wasCorrect ? theme.success : theme.error,
                  },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewWord, { color: theme.primary }]}>{w.word}</Text>
                  {wasCorrect ? (
                    <CheckCircle size={20} color={theme.success} />
                  ) : (
                    <XCircle size={20} color={theme.error} />
                  )}
                </View>
                <Text style={[styles.reviewDef, { color: theme.textSecondary }]}>
                  {w.definition}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.comeBackMsg, { color: theme.textSecondary }]}>
          Come back tomorrow for a new challenge!
        </Text>
      </ScrollView>
    );
  }

  // ── Quiz phase ────────────────────────────────────────────────────────────────

  if (!currentWord) return null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Flame size={22} color="#FFF" fill="#FFF" />
          <Text style={styles.headerTitle}>Daily Challenge</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+20 XP</Text>
          </View>
        </View>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        {renderProgressDots()}
      </LinearGradient>

      <ScrollView style={styles.quizBody} showsVerticalScrollIndicator={false}>
        {/* Word card */}
        <View style={[styles.wordCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.wordCardLabel, { color: theme.textSecondary }]}>
            Word {currentWordIndex + 1} of {totalWords}
          </Text>
          <Text style={[styles.wordCardWord, { color: theme.primary }]}>
            {currentWord.word}
          </Text>
          <Text style={[styles.wordCardPos, { color: theme.textSecondary }]}>
            {currentWord.partOfSpeech}
          </Text>
        </View>

        {/* Prompt */}
        <Text style={[styles.prompt, { color: theme.text }]}>
          What does this word mean?
        </Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {currentWord.options.map((opt, idx) => renderOptionButton(opt, idx))}
        </View>

        {/* Next button (visible after answering) */}
        {showResult && currentWordIndex < totalWords - 1 && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={handleNextWord}
            testID="next-word-button"
          >
            <Text style={styles.nextButtonText}>Next Word →</Text>
          </TouchableOpacity>
        )}

        {/* Result message */}
        {showResult && (
          <View
            style={[
              styles.resultBanner,
              {
                backgroundColor:
                  selectedOption === currentWord.correctIndex ? '#D1FAE5' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.resultText,
                {
                  color:
                    selectedOption === currentWord.correctIndex ? '#065F46' : '#991B1B',
                },
              ]}
            >
              {selectedOption === currentWord.correctIndex
                ? '✅ Correct! Great job!'
                : `❌ Not quite — the answer was: "${currentWord.options[currentWord.correctIndex]}"`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  xpBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Quiz body
  quizBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  wordCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  wordCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wordCardWord: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  wordCardPos: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Options
  optionsList: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '800',
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  // Result
  resultBanner: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  nextButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  // Error state
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Completion
  completionContent: {
    paddingBottom: 40,
  },
  completionHero: {
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    marginBottom: 28,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 8,
  },
  reviewSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewWord: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  reviewDef: {
    fontSize: 14,
    lineHeight: 20,
  },
  comeBackMsg: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 32,
    marginTop: 8,
  },
});
