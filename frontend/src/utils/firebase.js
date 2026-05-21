import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    // Ensure Notifications permission is granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      console.log('Notifications permission not granted');
      return null;
    }

    // Register service worker explicitly so getToken can use it
    let swReg = null;
    try {
      if ('serviceWorker' in navigator) {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await swReg.update();
      }
    } catch (swErr) {
      console.warn('Service worker registration failed:', swErr);
    }

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg || undefined
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      try {
        await api.put('/users/fcm-token', { fcmToken: currentToken });
      } catch (err) {
        console.warn('Failed to update FCM token on server', err.response?.data || err.message);
      }
      return currentToken;
    }

    console.log('No registration token available.');
    return null;
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default app;
