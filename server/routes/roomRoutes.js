import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await req.db.all(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM messages m WHERE m.roomId = r.id) as messageCount,
        (SELECT content FROM messages m WHERE m.roomId = r.id ORDER BY timestamp DESC LIMIT 1) as lastMessage
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.roomId
      WHERE rm.userId = ?
    `, [req.user.id]);

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// Get single room
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    // Check if user is member of the room
    const isMember = await req.db.get(
      'SELECT 1 FROM room_members WHERE roomId = ? AND userId = ?',
      [roomId, req.user.id]
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const room = await req.db.get(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM messages m WHERE m.roomId = r.id) as messageCount,
        (SELECT content FROM messages m WHERE m.roomId = r.id ORDER BY timestamp DESC LIMIT 1) as lastMessage
      FROM rooms r
      WHERE r.id = ?
    `, [roomId]);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get room members
    room.members = await req.db.all(
      'SELECT u.id, u.username, u.avatar FROM users u INNER JOIN room_members rm ON u.id = rm.userId WHERE rm.roomId = ?',
      [roomId]
    );

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Failed to fetch room' });
  }
});

// Create room
router.post('/', authenticateToken, async (req, res) => {
  const { name, type = 'private', description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Room name is required' });
  }

  try {
    const result = await req.db.run(
      'INSERT INTO rooms (name, type, description, createdBy) VALUES (?, ?, ?, ?)',
      [name, type, description, req.user.id]
    );

    const roomId = result.lastID;

    // Add creator as member
    await req.db.run(
      'INSERT INTO room_members (roomId, userId, role) VALUES (?, ?, ?)',
      [roomId, req.user.id, 'owner']
    );

    const room = await req.db.get(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    // Notify connected clients about new room
    req.app.get('io').emit('room:created', room);

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// Update room settings
router.put('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, type, isPrivate } = req.body;
    const userId = req.user.id;
    const db = req.db;

    // Check if user is owner or admin
    const member = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ? AND role IN ("owner", "admin")',
        [roomId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update room settings'
      });
    }

    // Update room
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE rooms 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            type = COALESCE(?, type),
            isPrivate = COALESCE(?, isPrivate),
            updatedAt = DATETIME('now')
        WHERE id = ?
      `, [name, description, type, isPrivate, roomId], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room settings'
    });
  }
});

// Add member to room
router.post('/:roomId/members', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId: targetUserId, role = 'member' } = req.body;
    const requesterId = req.user.id;
    const db = req.db;

    // Check if requester has permission
    const requester = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ? AND role IN ("owner", "admin")',
        [roomId, requesterId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add members'
      });
    }

    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [targetUserId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add member
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO room_members (roomId, userId, role)
        VALUES (?, ?, ?)
      `, [roomId, targetUserId, role], (err) => {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            reject(new Error('User is already a member'));
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: error.message === 'User is already a member' ? error.message : 'Failed to add member'
    });
  }
});

// Update member role
router.put('/:roomId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;
    const db = req.db;

    // Check if requester is owner
    const requester = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ? AND role = "owner"',
        [roomId, requesterId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can update roles'
      });
    }

    // Update role
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE room_members 
        SET role = ?
        WHERE roomId = ? AND userId = ?
      `, [role, roomId, targetUserId], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
});

// Remove member from room
router.delete('/:roomId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const requesterId = req.user.id;
    const db = req.db;

    // Check if requester has permission
    const requester = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ? AND role IN ("owner", "admin")',
        [roomId, requesterId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to remove members'
      });
    }

    // Check target's role
    const target = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ?',
        [roomId, targetUserId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Prevent removing owner
    if (target.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove room owner'
      });
    }

    // Remove member
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM room_members 
        WHERE roomId = ? AND userId = ?
      `, [roomId, targetUserId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

// Delete room
router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const db = req.db;

    // Check if user is owner
    const member = await new Promise((resolve, reject) => {
      db.get(
        'SELECT role FROM room_members WHERE roomId = ? AND userId = ? AND role = "owner"',
        [roomId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can delete the room'
      });
    }

    // Delete room members
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM room_members WHERE roomId = ?', [roomId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Delete room messages
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM messages WHERE roomId = ?', [roomId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Delete room
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM rooms WHERE id = ?', [roomId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

export default router; 