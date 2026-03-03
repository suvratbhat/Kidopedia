import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useProfile } from '@/contexts/ProfileContext';
import { badgesService, Badge, EarnedBadge } from '@/services/badgesService';
import { BadgeCard } from '../components/BadgeCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Trophy } from 'lucide-react-native';

export default function TrophiesScreen() {
  const { activeProfile, theme } = useProfile();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeProfile) return;

    try {
      const [badges, earned] = await Promise.all([
        badgesService.getAllBadges(),
        badgesService.getEarnedBadges(activeProfile.id),
      ]);
      setAllBadges(badges);
      setEarnedBadges(earned);
    } catch (error) {
      console.error('Error loading trophies:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.find(eb => eb.badge_id === badgeId);
  };

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner message="Loading your trophies..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Trophy size={64} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.headerTitle}>Trophy Room</Text>
        <Text style={styles.headerSubtitle}>
          You've earned {earnedBadges.length} of {allBadges.length} badges!
        </Text>
      </View>

      <View style={styles.badgesList}>
        <Text style={styles.sectionTitle}>Your Collection</Text>
        {allBadges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No badges available yet. Keep learning!</Text>
          </View>
        ) : (
          allBadges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <BadgeCard
                key={badge.id}
                title={badge.title}
                description={badge.description}
                icon={badge.icon}
                isEarned={!!earned}
                unlockedAt={earned?.unlocked_at}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    opacity: 0.95,
    marginTop: 6,
  },
  badgesList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
