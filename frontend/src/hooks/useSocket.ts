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

    // Get Socket.IO URL with production validation
    const getSocketUrl = () => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction && !socketUrl) {
        console.error('❌ CONFIGURATION ERROR: NEXT_PUBLIC_SOCKET_URL is not set in production');
        console.warn('⚠️  Socket.IO will not connect. Please set NEXT_PUBLIC_SOCKET_URL in Vercel Environment Variables.');
        return null;
      }
      
      // Default to localhost for development - backend Socket.IO is at root with /notifications namespace
      return socketUrl || 'http://localhost:4000';
    };

    const socketUrl = getSocketUrl();
    
    // If no URL available (production misconfiguration), don't connect
    if (!socketUrl) {
      console.warn('⚠️  Socket.IO disabled due to missing configuration');
      setConnected(false);
      return;
    }

    console.log('🔌 Initializing socket connection');
    console.log('   Environment:', process.env.NODE_ENV);
    console.log('   Socket URL:', socketUrl);
    console.log('   Namespace: /notifications');

    const socket = io(`${socketUrl}/notifications`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('   Socket ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      console.error('   Description:', err.description);
      console.error('   Type:', err.type);
      setConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('✅ Socket authenticated:', data);
    });

    // Cleanup on unmount/token change
    return () => {
      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('connected');
        if (socket.connected) {
          socket.disconnect();
        }
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
