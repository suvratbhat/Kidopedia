import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const NOTIFICATIONS_ENABLED_KEY = 'word_of_the_day_notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  async initialize() {
    // Listen for notification responses (taps)
    Notifications.addNotificationResponseReceivedListener(response => {
      const { wordId } = response.notification.request.content.data;
      if (wordId) {
        // Deep link to the word screen
        router.push(`/word/${encodeURIComponent(wordId)}`);
      }
    });

    const enabled = await this.isNotificationsEnabled();
    if (enabled) {
      await this.registerForPushNotificationsAsync();
    }
  }

  async registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Device.expoConfig?.extra?.eas?.projectId,
    })).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  async setNotificationsEnabled(enabled: boolean) {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
    if (enabled) {
      await this.registerForPushNotificationsAsync();
      // In a real app, you'd send the token to your backend here
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  async isNotificationsEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value ? JSON.parse(value) : false;
  }

  async scheduleDailyWordNotification(word: string, emoji: string) {
    const enabled = await this.isNotificationsEnabled();
    if (!enabled) return;

    // Cancel existing to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for 8:00 AM every day
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Morning Word! ☀️",
        body: `Today's special word is: ${word.toUpperCase()} ${emoji}`,
        data: { wordId: word },
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      } as Notifications.NotificationTriggerInput,
    });
  }

  async sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Kidopedia Test! 🚀",
        body: "Your notifications are working perfectly!",
      },
      trigger: null, // immediate
    });
  }
}

export const notificationService = new NotificationService();
