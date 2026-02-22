import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Star, Award, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementBadgeProps {
  type: 'trophy' | 'star' | 'award' | 'target';
  count: number;
  label: string;
  gradient: string[];
}

export function AchievementBadge({ type, count, label, gradient }: AchievementBadgeProps) {
  const IconComponent = {
    trophy: Trophy,
    star: Star,
    award: Award,
    target: Target,
  }[type];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <IconComponent size={24} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={styles.count}>{count}</Text>
      </LinearGradient>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
  },
  count: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
});
