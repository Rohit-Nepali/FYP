import { getApp } from '@react-native-firebase/app';

export function initializeFirebase() {
  // This forces native Firebase app to load
  try {
    getApp();
    console.log('✅ Firebase native app initialized');
  } catch (error) {
    console.log('Firebase app not initialized');
  }
}
