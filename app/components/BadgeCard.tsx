import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BadgeCardProps {
  title: string;
  description: string;
  icon: string;
  isEarned: boolean;
  unlockedAt?: string;
}

export function BadgeCard({ title, description, icon, isEarned, unlockedAt }: BadgeCardProps) {
  const grayscale = ['#E2E8F0', '#CBD5E1'];
  // Gold/Orange gradient for earned badges, grey for locked
  const colors = isEarned ? ['#FCD34D', '#F59E0B'] : grayscale;

  return (
    <View style={[styles.container, !isEarned && styles.lockedContainer]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Text style={[styles.icon, !isEarned && styles.lockedIcon]}>{icon}</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={[styles.title, !isEarned && styles.lockedText]}>{title}</Text>
        <Text style={[styles.description, !isEarned && styles.lockedText]}>{description}</Text>
        {isEarned && unlockedAt && (
          <Text style={styles.date}>
            Earned on {new Date(unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  lockedContainer: {
    opacity: 0.8,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
  },
  lockedIcon: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  lockedText: {
    color: '#94A3B8',
  },
  date: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
