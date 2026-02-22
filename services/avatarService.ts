export type AvatarStyle = 'boy' | 'girl' | 'other';

const BOY_STYLES = [
  'adventurer',
  'avataaars',
  'big-smile',
  'bottts',
  'fun-emoji',
];

const GIRL_STYLES = [
  'adventurer',
  'avataaars',
  'big-smile',
  'fun-emoji',
  'lorelei',
];

const NEUTRAL_STYLES = [
  'adventurer',
  'avataaars',
  'big-smile',
  'fun-emoji',
  'bottts',
];

const BOY_COLORS = [
  '#3B82F6', // Blue
  '#60A5FA', // Light Blue
  '#2563EB', // Dark Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
];

const GIRL_COLORS = [
  '#EC4899', // Pink
  '#F9A8D4', // Light Pink
  '#DB2777', // Hot Pink
  '#A855F7', // Purple
  '#F472B6', // Rose
  '#FCA5A5', // Soft Red
];

const NEUTRAL_COLORS = [
  '#10B981', // Green
  '#34D399', // Light Green
  '#F59E0B', // Orange
  '#FBBF24', // Yellow
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
];

export const avatarService = {
  getRandomAvatarUrl(gender: AvatarStyle, seed?: string): string {
    const actualSeed = seed || Math.random().toString(36).substring(7);
    let style: string;

    switch (gender) {
      case 'boy':
        style = BOY_STYLES[Math.floor(Math.random() * BOY_STYLES.length)];
        break;
      case 'girl':
        style = GIRL_STYLES[Math.floor(Math.random() * GIRL_STYLES.length)];
        break;
      default:
        style = NEUTRAL_STYLES[Math.floor(Math.random() * NEUTRAL_STYLES.length)];
    }

    return `https://api.dicebear.com/7.x/${style}/svg?seed=${actualSeed}`;
  },

  getRandomColor(gender: AvatarStyle): string {
    switch (gender) {
      case 'boy':
        return BOY_COLORS[Math.floor(Math.random() * BOY_COLORS.length)];
      case 'girl':
        return GIRL_COLORS[Math.floor(Math.random() * GIRL_COLORS.length)];
      default:
        return NEUTRAL_COLORS[Math.floor(Math.random() * NEUTRAL_COLORS.length)];
    }
  },

  getColorPalette(gender: AvatarStyle): string[] {
    switch (gender) {
      case 'boy':
        return BOY_COLORS;
      case 'girl':
        return GIRL_COLORS;
      default:
        return NEUTRAL_COLORS;
    }
  },
};
