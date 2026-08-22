import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const REMINDER_IDENTIFIER = 'remember-daily-reminder';

let notificationHandlerConfigured = false;

async function getNotifications() {
  try {
    const Notifications = await import('expo-notifications');
    if (!notificationHandlerConfigured && Notifications.setNotificationHandler) {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
        notificationHandlerConfigured = true;
      } catch {}
    }
    return Notifications;
  } catch {
    return null;
  }
}

export async function scheduleDailyReminder(time: string): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    const [hour, minute] = time.split(':').map(Number);

    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: 'Time to reflect',
        body: "Today's thoughts are waiting for you.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Daily reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
  } catch {}
}

