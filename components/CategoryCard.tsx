import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  gradient: string[];
  wordCount: number;
  learned: number;
  onPress: () => void;
}

export function CategoryCard({
  title,
  icon: Icon,
  gradient,
  wordCount,
  learned,
  onPress
}: CategoryCardProps) {
  const percentage = Math.round((learned / wordCount) * 100);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Icon size={36} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {learned}/{wordCount} words
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    aspectRatio: 1,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
