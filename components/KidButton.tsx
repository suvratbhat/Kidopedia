import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useProfile } from '@/contexts/ProfileContext';

interface KidButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function KidButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
}: KidButtonProps) {
  const { theme } = useProfile();

  const getBackgroundColor = () => {
    if (disabled) return theme.textSecondary;
    switch (variant) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.accent;
      case 'outline':
        return 'transparent';
      default:
        return theme.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return theme.primary;
    return '#FFFFFF';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.primary : 'transparent',
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        getPadding(),
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
