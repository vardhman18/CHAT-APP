const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    const db = req.db;

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password, displayName) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, displayName || username],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    // Create user preferences
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_preferences (userId) VALUES (?)',
        [result.lastID],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get created user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, displayName FROM users WHERE id = ?',
        [result.lastID],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.db;

    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    db.run('UPDATE users SET lastSeen = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, displayName, avatar, bio, status FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user information'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body;
    const userId = req.user.id;
    const db = req.db;

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET displayName = COALESCE(?, displayName),
             bio = COALESCE(?, bio),
             avatar = COALESCE(?, avatar),
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [displayName, bio, avatar, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const updatedUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, displayName, avatar, bio FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.db;

    const preferences = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_preferences WHERE userId = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferences not found'
      });
    }

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { theme, emailNotifications, pushNotifications, messagePreview } = req.body;
    const userId = req.user.id;
    const db = req.db;

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE user_preferences 
         SET theme = COALESCE(?, theme),
             emailNotifications = COALESCE(?, emailNotifications),
             pushNotifications = COALESCE(?, pushNotifications),
             messagePreview = COALESCE(?, messagePreview),
             updatedAt = CURRENT_TIMESTAMP
         WHERE userId = ?`,
        [theme, emailNotifications, pushNotifications, messagePreview, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const updatedPreferences = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_preferences WHERE userId = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user preferences'
    });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const userId = req.user.id;
    const db = req.db;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const query = `
      SELECT id, username, displayName, avatar, status, lastSeen 
      FROM users 
      WHERE (username LIKE ? OR displayName LIKE ?) 
      AND id != ? 
      LIMIT 10
    `;
    const searchPattern = `%${searchTerm}%`;

    const users = await new Promise((resolve, reject) => {
      db.all(query, [searchPattern, searchPattern, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Add contact
router.post('/contacts/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.userId;
    const db = req.db;

    // Check if contact exists
    const contact = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [contactId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check if already a contact
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_contacts WHERE userId = ? AND contactId = ?', 
        [userId, contactId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Contact already added'
      });
    }

    // Add contact
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO user_contacts (userId, contactId) VALUES (?, ?)',
        [userId, contactId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      contact: {
        id: contact.id,
        username: contact.username,
        displayName: contact.displayName,
        avatar: contact.avatar,
        status: contact.status,
        lastSeen: contact.lastSeen
      }
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contact'
    });
  }
});

// Remove contact
router.delete('/contacts/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.userId;
    const db = req.db;

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM user_contacts WHERE userId = ? AND contactId = ?',
        [userId, contactId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove contact'
    });
  }
});

// Get user contacts
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.db;

    const query = `
      SELECT u.id, u.username, u.displayName, u.avatar, u.status, u.lastSeen
      FROM users u
      JOIN user_contacts uc ON u.id = uc.contactId
      WHERE uc.userId = ?
    `;

    const contacts = await new Promise((resolve, reject) => {
      db.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contacts'
    });
  }
});

module.exports = router; 