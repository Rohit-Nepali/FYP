import { firebase } from '@react-native-firebase/app';

export function initializeFirebase() {
  // This forces native Firebase app to load
  if (!firebase.apps.length) {
    console.log(' Firebase native app initialized');
  }
}
