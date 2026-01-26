import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import { ExpoRoot } from 'expo-router';

// MUST be outside React
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📦 Background message:', remoteMessage);
});

registerRootComponent(ExpoRoot);
