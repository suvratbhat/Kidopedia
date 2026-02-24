import 'react-native-url-polyfill/auto';
import '@/lib/networkPolyfill';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { notificationService } from '../services/notificationService';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { sqliteService } from '@/services/sqliteService';
import { syncService } from '@/services/syncService';
import { localProfileService } from '@/services/localProfileService';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Init SQLite — must run before any other service
      await sqliteService.initializeDatabase();

      // 2. Check if first-launch setup has been completed
      const setupDone = await sqliteService.getSyncMeta('initial_setup_complete');
      if (setupDone !== 'true') {
        router.replace('/setup' as any);
        return;
      }

      // 3. Push any profiles that were created/updated offline
      localProfileService.pushUnsyncedProfiles().catch(() => {});

      // 4. Check 90-day sync schedule — fire-and-forget
      if (await syncService.isSyncNeeded()) {
        syncService.startSync().catch(console.error);
      }

      // 5. Notifications
      await notificationService.initialize();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="profiles" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="word/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ProfileProvider>
  );
}
