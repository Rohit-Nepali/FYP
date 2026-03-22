import admin from 'firebase-admin';
import { prisma } from '#config/db.js';

const hasFirebaseConfig = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

if (hasFirebaseConfig && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

export async function sendPushNotification(token, title, body, data = {}) {
  try {
    if (!hasFirebaseConfig || admin.apps.length === 0 || !token) {
      return null;
    }

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

export async function createInAppNotification({ userId, type, title, message, data = null }) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
    },
  });
}

export async function getInAppNotifications(userId, { unreadOnly = false } = {}) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
