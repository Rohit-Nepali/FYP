import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

export function registerBackgroundHandler() {
  const messaging = getMessaging();

  setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('📦 Background notification received:', remoteMessage);
  });
}