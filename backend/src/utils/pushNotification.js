const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
// It's recommended to use environment variables for service account details
if (!admin.apps.length) {
  try {
    // Load the service account JSON file from the root of the backend folder
    // ENSURE THIS FILE IS THE UNEDITED DOWNLOAD FROM FIREBASE CONSOLE
    const serviceAccount = require('../../firebase-key.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

/**
 * Send push notification to a user
 * @param {string} userId - ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log(`Push notification skipped: No FCM token for user ${userId}`);
      return;
    }

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For mobile if needed
      },
      token: user.fcmToken
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    // If token is invalid, clear it
    if (error.code === 'messaging/registration-token-not-registered') {
      await User.findByIdAndUpdate(userId, { fcmToken: null });
    }
  }
};

module.exports = { sendPushNotification };
