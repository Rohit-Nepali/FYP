import { useEffect } from "react";
import {
  setNotificationHandler,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  requestFirebasePermission,
  getFcmToken,
  getInitialNotification,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import messaging from '@react-native-firebase/messaging';
import { axiosInstance } from "../services/authService";
import { updateDigestPreferences } from "../services/userService";
import useAlert from "../hooks/useAlert";

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

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

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await updateDigestPreferences({ timezone, digestHourLocal: 19 });

      // Listen for token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
        console.log('FCM Token refreshed:', newToken);
        await registerTokenWithBackend(newToken);
      });

      // Set up notification handlers
      setNotificationHandler();

      // Listen for foreground notifications
      const receivedSub = addNotificationReceivedListener(notification => {
        console.log("🔔 Notification received:", notification);
        // Show in-app custom alert for foreground notifications
        showAlert({
          title: notification.request.content.title || 'Notification',
          message: notification.request.content.body || 'You have a new notification',
          type: 'info',
          confirmText: 'OK',
        });
      });

      // Listen for notification tap (when app was in background)
      const responseSub = addNotificationResponseReceivedListener(response => {
        console.log("👉 Notification tapped:", response);
        const data = response.notification.request.content.data;
        if (data?.taskId) {
          console.log('Navigate to task:', data.taskId);
          // You can add navigation logic here if needed
        }
      });

      // Check if app was opened from a notification (when app was killed)
      const initialNotification = await getInitialNotification();
      if (initialNotification) {
        console.log('📱 App opened from notification:', initialNotification);
        if (initialNotification.data?.taskId) {
          console.log('Navigate to task:', initialNotification.data.taskId);
          // You can add navigation logic here if needed
        }
      }

      return () => {
        unsubscribeTokenRefresh();
        receivedSub.remove();
        responseSub.remove();
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

  return (
    <>
      {children}
      {AlertComponent}
    </>
  );
};
