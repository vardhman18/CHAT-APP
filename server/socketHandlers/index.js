const jwt = require('jsonwebtoken');

const handleSocketConnection = (io) => (socket) => {
  const db = socket.db; // Get database from socket instance
  let userId = null;
  let currentRoom = null;

  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = decoded.id;

      // Update user status
      db.run('UPDATE users SET status = ? WHERE id = ?', ['online', userId]);

      // Join user's rooms
      db.all('SELECT roomId FROM room_members WHERE userId = ?', [userId], (err, rooms) => {
        if (err) {
          console.error('Error getting user rooms:', err);
          return;
        }

        rooms.forEach(room => {
          socket.join(`room:${room.roomId}`);
        });
      });

      // Notify others that user is online
      socket.broadcast.emit('user:status', { userId, status: 'online' });
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  });

  // Handle joining a room
  socket.on('room:join', (roomId) => {
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    currentRoom = roomId;
    socket.join(`room:${roomId}`);
    
    // Notify room members
    socket.to(`room:${roomId}`).emit('room:user_joined', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle leaving a room
  socket.on('room:leave', (roomId) => {
    if (!userId) return;
    
    socket.leave(`room:${roomId}`);
    if (currentRoom === roomId) {
      currentRoom = null;
    }

    // Notify room members
    socket.to(`room:${roomId}`).emit('room:user_left', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle new message
  socket.on('message:new', (data) => {
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { content, roomId = currentRoom, type = 'text', attachments = [] } = data;

    if (!roomId) {
      socket.emit('error', { message: 'No room specified' });
      return;
    }

    // Create message object
    const message = {
      id: Date.now().toString(),
      content,
      roomId,
      userId,
      type,
      attachments,
      timestamp: new Date().toISOString()
    };

    // Store in database
    db.run(
      'INSERT INTO messages (id, content, roomId, userId, type, attachments, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [message.id, content, roomId, userId, type, JSON.stringify(attachments), message.timestamp],
      (err) => {
        if (err) {
          console.error('Error saving message:', err);
          socket.emit('error', { message: 'Failed to save message' });
          return;
        }

        // Broadcast to room
        io.to(`room:${roomId}`).emit('message:new', message);

        // Update room's last activity
        db.run('UPDATE rooms SET lastActivity = ? WHERE id = ?', [message.timestamp, roomId]);
      }
    );
  });

  // Handle typing status
  socket.on('typing:start', (roomId) => {
    if (!userId) return;
    socket.to(`room:${roomId}`).emit('typing:start', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing:stop', (roomId) => {
    if (!userId) return;
    socket.to(`room:${roomId}`).emit('typing:stop', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (!userId) return;

    // Update user status
    db.run(
      'UPDATE users SET status = ?, lastSeen = CURRENT_TIMESTAMP WHERE id = ?',
      ['offline', userId],
      (err) => {
        if (err) {
          console.error('Error updating user status:', err);
          return;
        }

        // Notify others that user is offline
        socket.broadcast.emit('user:status', {
          userId,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      }
    );
  });
};

module.exports = { handleSocketConnection };