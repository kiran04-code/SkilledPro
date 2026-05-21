const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const localKeyPath = path.resolve(__dirname, '../../firebase-key.json');
  if (fs.existsSync(localKeyPath)) {
    return JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
  }

  return null;
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = loadServiceAccount();

    if (!serviceAccount) {
      console.warn('Firebase Admin skipped: no service account credentials configured.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log('Firebase Admin Initialized');
    }
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
      console.log(`Push notification skipped: No FCM token for user ${userId} (user found: ${!!user})`);
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

    if (!admin.apps.length) {
      console.log('Push notification skipped: Firebase Admin is not configured');
      return;
    }

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully to user', userId, 'response:', response);
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
