import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export async function requestFirebasePermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
}

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

// Listen to messages when app is in foreground
export function setupForegroundListener() {
  messaging().onMessage(async remoteMessage => {
    console.log('Foreground message:', remoteMessage);
  });
}

// Expo-compatible functions
export function setNotificationHandler() {
  // For FCM, handler is set via listeners
  console.log('Notification handler set');
}

export function addNotificationReceivedListener(callback: (notification: any) => void) {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
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

export function addNotificationResponseReceivedListener(callback: (response: any) => void) {
  const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
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
