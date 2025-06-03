import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL, SOCKET_OPTIONS, CONNECTION_ERROR_MESSAGES } from '../config/constants';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update axios authorization header when user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setError(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat server. Please check your connection.');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to socket server after', attemptNumber, 'attempts');
        setError(null);
        if (activeRoom) {
          newSocket.emit('room:join', activeRoom.id);
        }
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
        setError('Failed to reconnect to chat server. Please refresh the page.');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('user:online', (userId) => {
        setOnlineUsers(prev => [...prev, userId]);
      });

      newSocket.on('user:offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      newSocket.on('message:new', (message) => {
        setMessages(prev => [...prev, message]);
        // Update room's last message
        setRooms(prev => prev.map(room => 
          room.id === message.roomId 
            ? { ...room, lastMessage: message.content }
            : room
        ));
      });

      newSocket.on('message:update', (updatedMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      });

      newSocket.on('message:delete', (messageId) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      });

      newSocket.on('room:update', (updatedRoom) => {
        setRooms(prev => prev.map(room => 
          room.id === updatedRoom.id ? updatedRoom : room
        ));
      });

      setSocket(newSocket);

      return () => {
        if (activeRoom) {
          newSocket.emit('room:leave', activeRoom.id);
        }
        newSocket.disconnect();
      };
    }
  }, [user, activeRoom]);

  // Handle room changes
  useEffect(() => {
    if (socket && activeRoom) {
      // Leave previous room if any
      socket.emit('room:leave', activeRoom.id);
      // Join new room
      socket.emit('room:join', activeRoom.id);
      // Load messages for new room
      loadMessages(activeRoom.id);
    }
  }, [socket, activeRoom]);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms');
      setRooms(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('Failed to load rooms');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = async (roomId) => {
    if (!roomId) return;
    
    try {
      const response = await api.get(`/api/rooms/${roomId}/messages`);
      setMessages(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const sendMessage = async (content, roomId = activeRoom?.id) => {
    if (!roomId) {
      throw new Error('No room selected');
    }

    try {
      const response = await api.post(`/messages/room/${roomId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  };

  const createRoom = async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData);
      setRooms(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create room:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  };

  const value = {
    socket,
    activeRoom,
    setActiveRoom,
    rooms,
    messages,
    onlineUsers,
    loading,
    error,
    sendMessage,
    createRoom,
    loadRooms,
    loadMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 