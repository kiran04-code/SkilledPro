import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user?._id) {
      const newSocket = io('http://localhost:5001');

      newSocket.emit('join_user', user._id);

      // Global notification listener
      newSocket.on('notification', (data) => {
        toast.success(data.message, { duration: 4000 });
      });

      // Global payment notification listener
      newSocket.on('payment_notification', (data) => {
        toast.success(data.message, { duration: 6000 });
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);