import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestForToken, onMessageListener } from '../utils/firebase';
import toast from 'react-hot-toast';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const token = await requestForToken();
          if (token) console.log('FCM token registered for user');
        } catch (err) { console.warn('requestForToken failed', err); }
      })();

      const setupListener = async () => {
        try {
          const payload = await onMessageListener();
          console.log('Foreground message received:', payload);
          
          const { projectId, type } = payload.data || {};
          
          // Don't show toast if user is already on the chat page for this project
          const isCurrentChat = location.pathname === `/chat/${projectId}`;
          
          if (type === 'chat_message' && isCurrentChat) {
            return;
          }

          toast(payload.notification.body, {
            icon: '🔔',
            duration: 5000,
            position: 'top-right'
          });
          
          // Recursively setup listener again
          setupListener();
        } catch (err) {
          console.log('failed: ', err);
        }
      };

      setupListener();
    }
  }, [user, location.pathname]);

  return null;
}
