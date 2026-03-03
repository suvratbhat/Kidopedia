import { notificationService } from '../notificationService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { MAX: 4 },
}));

jest.mock('expo-constants', () => ({
  isDevice: true,
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

describe('NotificationService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('isNotificationsEnabled returns false by default', async () => {
    const enabled = await notificationService.isNotificationsEnabled();
    expect(enabled).toBe(false);
  });

  test('setNotificationsEnabled stores value and cancels notifications if disabled', async () => {
    await notificationService.setNotificationsEnabled(false);
    expect(await notificationService.isNotificationsEnabled()).toBe(false);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  test('scheduleDailyWordNotification does nothing if disabled', async () => {
    await AsyncStorage.setItem('word_of_the_day_notifications_enabled', 'false');
    await notificationService.scheduleDailyWordNotification('apple', '🍎');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('scheduleDailyWordNotification schedules if enabled', async () => {
    await AsyncStorage.setItem('word_of_the_day_notifications_enabled', 'true');
    await notificationService.scheduleDailyWordNotification('apple', '🍎');
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: expect.stringContaining('APPLE'),
        }),
        trigger: expect.objectContaining({
          hour: 8,
          minute: 0,
        }),
      })
    );
  });

  test('sendTestNotification schedules immediate notification', async () => {
    await notificationService.sendTestNotification();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('Kidopedia Test'),
        }),
        trigger: null,
      })
    );
  });
});
