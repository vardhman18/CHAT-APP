import { io } from "socket.io-client";
import { SOCKET_URL, SOCKET_OPTIONS, CONNECTION_ERROR_MESSAGES } from './config/constants';

let socket;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const socketOptions = {
    ...SOCKET_OPTIONS,
    auth: { token },
    forceNew: true,
    timeout: 10000,
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  };

  socket = io(SOCKET_URL, socketOptions);

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('connect_error', (error) => {
    console.error(CONNECTION_ERROR_MESSAGES.SOCKET, error);
    // Try to reconnect with polling if websocket fails
    if (socket.io.opts.transports.includes('websocket')) {
      console.log('Retrying connection with polling transport');
      socket.io.opts.transports = ['polling'];
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from socket server:', reason);
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      socket.connect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Successfully reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_attempt', () => {
    console.log('Attempting to reconnect...');
  });

  socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect after all attempts');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      ...SOCKET_OPTIONS,
      autoConnect: false,
      forceNew: true,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });
  }

  return socket;
};

export { socket };
