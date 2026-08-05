import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuthStore from '@/store/authStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // If not authenticated or token is not loaded, do not connect
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    // Connect to backend port 4000 with the /notifications namespace
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000/notifications';

    console.log('Initializing socket connection to:', socketUrl);

    const socket = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    // Cleanup on unmount/token change
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, isAuthenticated]);

  return {
    socket: socketRef.current,
    connected,
  };
};
