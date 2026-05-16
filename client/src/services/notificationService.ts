import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request notification permissions (Firebase + Android 13+ POST_NOTIFICATIONS)
 */
export async function requestFirebasePermission(): Promise<boolean> {
  // Request Android 13+ POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Android POST_NOTIFICATIONS permission denied');
      return false;
    }
  }

  // Request Firebase messaging permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
}

/**
 * Check if notification permissions are currently enabled.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const androidGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    if (!androidGranted) {
      return false;
    }
  }

  const authStatus = await messaging().hasPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Get the FCM token for this device
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (e) {
    console.error('Error getting FCM token:', e);
    return null;
  }
}

/**
 * Set up notification handler (called once at app start)
 */
export function setNotificationHandler() {
  console.log('Notification handler set');
}

/**
 * Listen for foreground messages
 */
export function addNotificationReceivedListener(callback: (notification: any) => void) {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received:', remoteMessage);

    // Transform FCM message to Expo-like format
    const notification = {
      request: {
        content: {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        }
      }
    };
    callback(notification);
  });

  return {
    remove: unsubscribe,
  };
}

/**
 * Listen for notification tap events (when app is in background)
 */
export function addNotificationResponseReceivedListener(callback: (response: any) => void) {
  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened from background:', remoteMessage);

    // Transform FCM message to Expo-like format
    const response = {
      notification: {
        request: {
          content: {
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          }
        }
      }
    };
    callback(response);
  });

  return {
    remove: unsubscribe,
  };
}

/**
 * Check if app was opened from a notification (when app was killed)
 */
export async function getInitialNotification() {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    console.log('App opened from killed state via notification:', remoteMessage);
    return {
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
    };
  }
  return null;
}
