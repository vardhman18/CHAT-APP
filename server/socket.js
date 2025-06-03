const jwt = require('jsonwebtoken');
const db = require('./db');

module.exports = (io) => {
  // Store online users
  const onlineUsers = new Map();
  
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Update user's last seen
    await db.run(
      'UPDATE users SET last_seen = datetime("now") WHERE id = ?',
      [userId]
    );

    // Broadcast user online status
    io.emit('user:online', userId);

    // Join user's rooms
    const rooms = await db.all(
      'SELECT room_id FROM room_members WHERE user_id = ?',
      [userId]
    );
    rooms.forEach(room => {
      socket.join(`room:${room.room_id}`);
    });

    // Handle typing status
    socket.on('typing:start', (roomId) => {
      socket.to(`room:${roomId}`).emit('typing:update', {
        userId,
        roomId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (roomId) => {
      socket.to(`room:${roomId}`).emit('typing:update', {
        userId,
        roomId,
        isTyping: false
      });
    });

    // Handle message delivery status
    socket.on('message:delivered', async ({ messageId }) => {
      try {
        await db.run(
          'UPDATE messages SET status = "delivered" WHERE id = ? AND status = "sent"',
          [messageId]
        );

        const { room_id: roomId } = await db.get(
          'SELECT room_id FROM messages WHERE id = ?',
          [messageId]
        );

        io.to(`room:${roomId}`).emit('message:status', {
          messageId,
          status: 'delivered'
        });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    socket.on('message:read', async ({ messageId }) => {
      try {
        await db.run(
          'UPDATE messages SET status = "read" WHERE id = ? AND status IN ("sent", "delivered")',
          [messageId]
        );

        const { room_id: roomId, user_id: senderId } = await db.get(
          'SELECT room_id, user_id FROM messages WHERE id = ?',
          [messageId]
        );

        io.to(`room:${roomId}`).emit('message:status', {
          messageId,
          status: 'read'
        });
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    // Handle room events
    socket.on('room:join', async (roomId) => {
      try {
        await db.run(
          'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
          [roomId, userId]
        );

        socket.join(`room:${roomId}`);

        const user = await db.get(
          'SELECT id, name, avatar FROM users WHERE id = ?',
          [userId]
        );

        io.to(`room:${roomId}`).emit('room:member_joined', {
          roomId,
          user
        });
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    socket.on('room:leave', async (roomId) => {
      try {
        await db.run(
          'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
          [roomId, userId]
        );

        socket.leave(`room:${roomId}`);

        io.to(`room:${roomId}`).emit('room:member_left', {
          roomId,
          userId
        });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      
      // Update user's last seen
      await db.run(
        'UPDATE users SET last_seen = datetime("now") WHERE id = ?',
        [userId]
      );

      // Broadcast user offline status
      io.emit('user:offline', userId);
    });
  });

  // Attach onlineUsers to io instance for use in routes
  io.onlineUsers = onlineUsers;
}; 