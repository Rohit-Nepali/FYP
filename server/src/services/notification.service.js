import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

export async function sendPushNotification(token, title, body, data = {}) {
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
