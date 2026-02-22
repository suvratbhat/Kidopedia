import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { KidButton } from '../../components/KidButton';
import { ProgressBar } from '../../components/ProgressBar';
import { offlineStorageService } from '../../services/offlineStorageService';
import { databaseService } from '../../services/databaseService';
import { Sparkles, Zap, Target, BookOpen, Brain, Gamepad2, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LearnScreen() {
  const router = useRouter();

  const handleRandomWord = async () => {
    try {
      const word = await offlineStorageService.getRandomCachedWord();
      if (word) {
        router.push(`/word/${encodeURIComponent(word.word)}`);
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

  const learningPaths = [
    {
      id: '1',
      title: 'Daily Quest',
      icon: Target,
      gradient: ['#FF6F61', '#FFA726'],
      description: 'Learn 5 new words today!',
      progress: 3,
      total: 5
    },
    {
      id: '2',
      title: 'Story Mode',
      icon: BookOpen,
      gradient: ['#42A5F5', '#1E88E5'],
      description: 'Learn words through stories',
      progress: 12,
      total: 20
    },
    {
      id: '3',
      title: 'Brain Trainer',
      icon: Brain,
      gradient: ['#66BB6A', '#43A047'],
      description: 'Practice with fun games',
      progress: 8,
      total: 10
    },
    {
      id: '4',
      title: 'Challenge Arena',
      icon: Gamepad2,
      gradient: ['#AB47BC', '#8E24AA'],
      description: 'Test your knowledge!',
      progress: 0,
      total: 5
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Learning Center</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Choose your adventure! 🎮</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#FFD54F', '#FFA726', '#FF6F61']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIcon}>
              <Sparkles size={40} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Word of the Day</Text>
            <Text style={styles.heroDescription}>
              Start your learning journey with a special word!
            </Text>
            <TouchableOpacity style={styles.heroButton} onPress={handleRandomWord}>
              <Text style={styles.heroButtonText}>Let's Go!</Text>
              <Zap size={20} color="#FFA726" fill="#FFA726" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Paths</Text>
          {learningPaths.map((path) => (
            <TouchableOpacity
              key={path.id}
              style={styles.pathCard}
              onPress={handleRandomWord}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={path.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pathIconContainer}
              >
                <path.icon size={28} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.pathContent}>
                <Text style={styles.pathTitle}>{path.title}</Text>
                <Text style={styles.pathDescription}>{path.description}</Text>
                <View style={styles.progressWrapper}>
                  <View style={styles.miniProgressBar}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        { width: `${(path.progress / path.total) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {path.progress}/{path.total}
                  </Text>
                </View>
              </View>
              {path.progress === path.total && (
                <Trophy size={24} color="#FFD54F" fill="#FFD54F" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    backgroundColor: '#42A5F5',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.95,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroGradient: {
    padding: 28,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 20,
    lineHeight: 22,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFA726',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 16,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pathIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathContent: {
    flex: 1,
    marginLeft: 16,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8EAF6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
    borderRadius: 10,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F8C8D',
  },
});
