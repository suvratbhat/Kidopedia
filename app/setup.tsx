/**
 * setup.tsx — First-launch setup screen.
 *
 * Shown once when the app has never been initialized.
 * Loads bundled seed words into SQLite, then optionally starts a
 * background Supabase sync before letting the user into the app.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { sqliteService } from '@/services/sqliteService';
import { syncService } from '@/services/syncService';
import { CachedWord } from '@/types/dictionary';

const seedData: CachedWord[] = require('../assets/data/seed-words.json');

type Phase = 'loading' | 'ready' | 'error';

export default function SetupScreen() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    loadSeedWords();
  }, []);

  const loadSeedWords = async () => {
    try {
      const words = seedData;
      setTotal(words.length);

      // Insert in batches of 20 to keep UI responsive
      const BATCH = 20;
      for (let i = 0; i < words.length; i += BATCH) {
        const slice = words.slice(i, i + BATCH);
        for (const word of slice) {
          await sqliteService.upsertWord(word);
        }
        const done = Math.min(i + BATCH, words.length);
        setLoaded(done);
        Animated.timing(progressAnim, {
          toValue: done / words.length,
          duration: 80,
          useNativeDriver: false,
        }).start();
      }

      await sqliteService.setSyncMeta('initial_setup_complete', 'true');
      setPhase('ready');

      // Start background Supabase sync (non-blocking)
      syncService.startSync().catch(() => {});
    } catch (err: any) {
      console.error('[Setup] Seed load failed:', err);
      setErrorMessage(err?.message ?? 'Unknown error');
      setPhase('error');
    }
  };

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  const handleRetry = async () => {
    setPhase('loading');
    setLoaded(0);
    setErrorMessage('');
    loadSeedWords();
  };

  const progressPercent = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>📖</Text>
        <Text style={styles.logoTitle}>Kidopedia</Text>
        <Text style={styles.logoSubtitle}>Your Smart Kids Dictionary</Text>
      </View>

      {phase === 'loading' && (
        <View style={styles.progressSection}>
          <Text style={styles.loadingTitle}>Getting things ready…</Text>
          <Text style={styles.loadingSubtitle}>
            Loading your dictionary — this only happens once!
          </Text>

          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {loaded} / {total} words ({progressPercent}%)
          </Text>
        </View>
      )}

      {phase === 'ready' && (
        <View style={styles.readySection}>
          <Text style={styles.readyTitle}>All set!</Text>
          <Text style={styles.readySubtitle}>
            {total} words loaded.{'\n'}
            Full dictionary sync is running in the background.
          </Text>

          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.startButtonText}>Start Learning!</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{errorMessage || 'Setup failed. Please try again.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#66BB6A',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 6,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressBarTrack: {
    width: '100%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 7,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
    borderRadius: 7,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  readySection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#66BB6A',
  },
  readySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#66BB6A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 28,
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  errorSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#aaa',
    fontWeight: '500',
  },
});
