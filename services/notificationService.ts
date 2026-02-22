import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Notification permission not granted');
          return;
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async scheduleWordReminderNotification(wordCount: number) {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Keep Learning! 📚',
          body: `You've learned ${wordCount} words today. Keep up the great work!`,
          sound: true,
        },
        trigger: {
          seconds: 86400,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async scheduleDailyReminder() {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to Learn! 🚀',
          body: 'Learn new words and earn rewards today!',
          sound: true,
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
