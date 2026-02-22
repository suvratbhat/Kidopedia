import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

interface LevelBannerProps {
  level: number;
  title: string;
  nextLevelWords: number;
}

export function LevelBanner({ level, title, nextLevelWords }: LevelBannerProps) {
  return (
    <LinearGradient
      colors={['#FF6F61', '#FFA726', '#FFD54F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.leftSection}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.levelText}>Level {level}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" />
        <Text style={styles.nextLevel}>{nextLevelWords} to next level</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6F61',
  },
  textContainer: {
    flex: 1,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  nextLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
});
