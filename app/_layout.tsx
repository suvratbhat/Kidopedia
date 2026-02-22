import 'react-native-url-polyfill/auto';
import '@/lib/networkPolyfill';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { notificationService } from '../services/notificationService';
import { ProfileProvider } from '@/contexts/ProfileContext';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await notificationService.initialize();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="profiles" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="word/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ProfileProvider>
  );
}
