import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBog2NDeiT4NzCd2xKWDspKFtGWfcbypB4",
  authDomain: "taskora-ca0f6.firebaseapp.com",
  projectId: "taskora-ca0f6",
  storageBucket: "taskora-ca0f6.firebasestorage.app",
  messagingSenderId: "495522754350",
  appId: "1:495522754350:android:860482c4c32af25e4e54bf"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;