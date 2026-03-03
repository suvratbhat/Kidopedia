import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Star, Trophy } from 'lucide-react-native';
import { useProfile } from '@/contexts/ProfileContext';

export type StreakBadgeVariant = 'flame' | 'star' | 'trophy';

interface StreakBadgeProps {
  /** Current streak count to display */
  count: number;
  /** Label shown beneath the badge */
  label: string;
  /** Visual variant — controls icon and gradient */
  variant?: StreakBadgeVariant;
  /** When true, renders a larger "celebration" form */
  large?: boolean;
}

const VARIANT_GRADIENTS: Record<StreakBadgeVariant, [string, string]> = {
  flame: ['#FF6B35', '#F7931E'],
  star: ['#FFD700', '#FFA500'],
  trophy: ['#9B59B6', '#6C3483'],
};

const VARIANT_ICONS: Record<StreakBadgeVariant, typeof Flame> = {
  flame: Flame,
  star: Star,
  trophy: Trophy,
};

export function StreakBadge({
  count,
  label,
  variant = 'flame',
  large = false,
}: StreakBadgeProps) {
  const { theme } = useProfile();
  const IconComponent = VARIANT_ICONS[variant];
  const gradient = VARIANT_GRADIENTS[variant];

  const badgeSize = large ? 90 : 70;
  const iconSize = large ? 30 : 22;
  const countFontSize = large ? 24 : 18;
  const borderRadius = large ? 24 : 20;

  return (
    <View style={styles.container} testID="streak-badge">
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius,
          },
        ]}
      >
        <IconComponent
          size={iconSize}
          color="#FFFFFF"
          strokeWidth={2.5}
          fill={variant === 'flame' ? '#FFFFFF' : 'none'}
        />
        <Text style={[styles.count, { fontSize: countFontSize }]} testID="streak-count">
          {count}
        </Text>
      </LinearGradient>
      <Text style={[styles.label, { color: theme.text }]} testID="streak-label">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
    gap: 2,
  },
  count: {
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
});
