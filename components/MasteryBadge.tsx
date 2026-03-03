import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Eye, Zap, Star } from 'lucide-react-native';
import { MasteryTier } from '@/services/masteryService';

// ─── Config ───────────────────────────────────────────────────────────────────

interface TierConfig {
  label: string;
  color: string;
  background: string;
  Icon: typeof Eye;
}

const TIER_CONFIG: Record<MasteryTier, TierConfig> = {
  seen: {
    label: 'Seen',
    color: '#6B7280',
    background: '#F3F4F6',
    Icon: Eye,
  },
  practiced: {
    label: 'Practiced',
    color: '#D97706',
    background: '#FEF3C7',
    Icon: Zap,
  },
  mastered: {
    label: 'Mastered',
    color: '#059669',
    background: '#D1FAE5',
    Icon: Star,
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MasteryBadgeProps {
  tier: MasteryTier;
  /** When true, shows only the icon without the text label */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MasteryBadge({ tier, compact = false }: MasteryBadgeProps) {
  const config = TIER_CONFIG[tier];
  const { label, color, background, Icon } = config;

  return (
    <View
      style={[styles.badge, { backgroundColor: background }]}
      testID="mastery-badge"
      accessibilityLabel={`Mastery: ${label}`}
    >
      <Icon
        size={14}
        color={color}
        strokeWidth={2.5}
        fill={tier === 'mastered' ? color : 'none'}
        testID="mastery-badge-icon"
      />
      {!compact && (
        <Text style={[styles.label, { color }]} testID="mastery-badge-label">
          {label}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
