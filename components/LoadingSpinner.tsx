import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useProfile } from '@/contexts/ProfileContext';

export function LoadingSpinner() {
  const { theme } = useProfile();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
