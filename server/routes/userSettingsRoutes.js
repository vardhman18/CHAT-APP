const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { displayName, bio, avatar } = req.body;
  const userId = req.user.id;
  const db = req.db;

  try {
    const query = `
      UPDATE users 
      SET displayName = COALESCE(?, displayName),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar),
          updatedAt = DATETIME('now')
      WHERE id = ?
    `;

    db.run(query, [displayName, bio, avatar, userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating profile' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during profile update' 
    });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const db = req.db;

    // Get user's current password
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT password FROM users WHERE id = ?', [userId], (err, row) => {
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

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
});

// Update notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, messagePreview } = req.body;
    const userId = req.user.id;
    const db = req.db;

    // Update preferences
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE user_preferences 
        SET emailNotifications = COALESCE(?, emailNotifications),
            pushNotifications = COALESCE(?, pushNotifications),
            messagePreview = COALESCE(?, messagePreview),
            updatedAt = DATETIME('now')
        WHERE userId = ?
      `, [emailNotifications, pushNotifications, messagePreview, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    if (result.changes === 0) {
      // If no preferences exist, create them
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO user_preferences 
          (userId, emailNotifications, pushNotifications, messagePreview)
          VALUES (?, ?, ?, ?)
        `, [userId, emailNotifications, pushNotifications, messagePreview],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        message: 'Notification preferences created successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const db = req.db;

  db.get('SELECT * FROM user_preferences WHERE userId = ?', [userId], (err, preferences) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching preferences' 
      });
    }

    res.json({ 
      success: true, 
      preferences: preferences || {} 
    });
  });
});

module.exports = router; 