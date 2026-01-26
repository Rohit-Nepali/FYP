import { useEffect } from "react";
import {
  setNotificationHandler,
  addNotificationReceivedListener,
  requestFirebasePermission,
  getFcmToken,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../config/environment";
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { axiosInstance } from "../services/authService";

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setupNotifications = async () => {
      // Request permissions
      const granted = await requestFirebasePermission();
      if (!granted) {
        console.log('Notification permission denied');
        return;
      }

      // Get initial token
      const token = await getFcmToken();
      if (token) {
        await registerTokenWithBackend(token);
      }

      // Listen for token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
        console.log('FCM Token refreshed:', newToken);
        await registerTokenWithBackend(newToken);
      });

      // Set up notification handlers
      setNotificationHandler();

      const receivedSub = addNotificationReceivedListener(notification => {
        console.log("🔔 Notification received:", notification);
        // Show alert for foreground notifications
        Alert.alert(
          notification.request.content.title || 'Notification',
          notification.request.content.body || 'You have a new notification'
        );
      });

      const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log("👉 Notification tapped:", remoteMessage);
      });

      return () => {
        unsubscribeTokenRefresh();
        receivedSub.remove();
        unsubscribeNotificationOpened();
      };
    };

    const cleanup = setupNotifications();

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [isAuthenticated, user]);

  const registerTokenWithBackend = async (token: string) => {
    try {
      await axiosInstance.post('/users/push-token', { pushToken: token });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  };

  return children;
};
