import admin from 'firebase-admin';

if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
} else {
  console.warn("Firebase project ID not found. Notification service will not be initialized.");
}

export async function sendPushNotification(token, title, body, data = {}) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn("Notification service not initialized. Skipping push notification.");
    return;
  }
  try {
    const message = {
      token,
      notification: { title, body },
      data,
    };
    await admin.messaging().send(message);
    console.log('Notification sent');
  } catch (err) {
    console.error(err);
  }
}
