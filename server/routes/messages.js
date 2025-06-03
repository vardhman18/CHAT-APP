import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get messages for a room
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    // Check if user is member of the room
    const isMember = await db.get(
      'SELECT 1 FROM room_members WHERE roomId = ? AND userId = ?',
      [roomId, req.user.id]
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await db.all(`
      SELECT m.*, u.username, u.avatar
      FROM messages m
      INNER JOIN users u ON m.userId = u.id
      WHERE m.roomId = ?
      ORDER BY m.timestamp ASC
    `, [roomId]);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Get single message
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    if (isNaN(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await db.get(`
      SELECT m.*, u.username, u.avatar
      FROM messages m
      INNER JOIN users u ON m.userId = u.id
      INNER JOIN room_members rm ON m.roomId = rm.roomId
      WHERE m.id = ? AND rm.userId = ?
    `, [messageId, req.user.id]);

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: 'Failed to fetch message' });
  }
});

// Send message
router.post('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is member of the room
    const isMember = await db.get(
      'SELECT 1 FROM room_members WHERE roomId = ? AND userId = ?',
      [roomId, req.user.id]
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await db.run(
      'INSERT INTO messages (roomId, userId, content, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [roomId, req.user.id, content]
    );

    const message = await db.get(`
      SELECT m.*, u.username, u.avatar
      FROM messages m
      INNER JOIN users u ON m.userId = u.id
      WHERE m.id = ?
    `, [result.lastID]);

    // Notify room members
    req.app.io.to(`room:${roomId}`).emit('message:new', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    // Check if reaction already exists
    const existing = await db.get(
      'SELECT * FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, userId, emoji]
    );

    if (existing) {
      // Remove reaction
      await db.run(
        'DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
        [messageId, userId, emoji]
      );
    } else {
      // Add reaction
      await db.run(
        'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
        [messageId, userId, emoji]
      );
    }

    // Get updated reactions
    const reactions = await db.all(
      `SELECT 
        r.*,
        json_object(
          'id', u.id,
          'name', u.name,
          'avatar', u.avatar
        ) as user
      FROM reactions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ?`,
      [messageId]
    );

    reactions.forEach(r => r.user = JSON.parse(r.user));

    // Get room ID for the message
    const { room_id: roomId } = await db.get(
      'SELECT room_id FROM messages WHERE id = ?',
      [messageId]
    );

    // Emit reaction update
    req.app.io.to(`room:${roomId}`).emit('message:reaction', {
      messageId,
      reactions
    });

    res.json(reactions);
  } catch (error) {
    console.error('Error handling reaction:', error);
    res.status(500).json({ error: 'Failed to handle reaction' });
  }
});

// Update message status
router.patch('/:messageId/status', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    await db.run(
      'UPDATE messages SET status = ? WHERE id = ?',
      [status, messageId]
    );

    // Get room ID for the message
    const { room_id: roomId } = await db.get(
      'SELECT room_id FROM messages WHERE id = ?',
      [messageId]
    );

    // Emit status update
    req.app.io.to(`room:${roomId}`).emit('message:status', {
      messageId,
      status
    });

    res.json({ status });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

export default router; 