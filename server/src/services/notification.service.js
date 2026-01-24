import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return false;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent:', tickets);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function sendPushNotifications(messages) {
  const validMessages = messages.filter(message => Expo.isExpoPushToken(message.to));

  if (validMessages.length === 0) {
    console.error('No valid push tokens provided');
    return [];
  }

  try {
    const tickets = await expo.sendPushNotificationsAsync(validMessages);
    console.log('Notifications sent:', tickets);
    return tickets;
  } catch (error) {
    console.error('Error sending notifications:', error);
    return [];
  }
}