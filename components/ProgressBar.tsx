import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
  color?: string[];
}

export function ProgressBar({
  current,
  total,
  label,
  color = ['#42A5F5', '#1E88E5']
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>{current}/{total}</Text>
      </View>
      <View style={styles.barBackground}>
        <LinearGradient
          colors={color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  barBackground: {
    height: 12,
    backgroundColor: '#E8EAF6',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 20,
  },
});
