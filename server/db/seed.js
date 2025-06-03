const bcrypt = require('bcryptjs');
const { db } = require('./index');

const seedDatabase = async () => {
  // Hash passwords for test users
  const password1 = await bcrypt.hash('password123', 10);
  const password2 = await bcrypt.hash('password456', 10);

  // Create test users
  const createUsers = `
    INSERT OR IGNORE INTO users (username, email, password, displayName, status, bio)
    VALUES 
      ('john_doe', 'john@example.com', ?, 'John Doe', 'online', 'Hey there! I am using Chat App'),
      ('jane_smith', 'jane@example.com', ?, 'Jane Smith', 'online', 'Software Developer');
  `;

  // Create test rooms
  const createRooms = `
    INSERT OR IGNORE INTO rooms (name, description, type, isPrivate, createdBy)
    VALUES
      ('General', 'General discussion room', 'public', 0, 1),
      ('Development', 'Tech discussions', 'public', 0, 1),
      ('Random', 'Random conversations', 'public', 0, 2);
  `;

  // Add room members
  const addRoomMembers = `
    INSERT OR IGNORE INTO room_members (roomId, userId, role)
    VALUES
      (1, 1, 'admin'),
      (1, 2, 'member'),
      (2, 1, 'admin'),
      (2, 2, 'member'),
      (3, 2, 'admin'),
      (3, 1, 'member');
  `;

  // Add some test messages
  const addMessages = `
    INSERT OR IGNORE INTO messages (content, roomId, userId)
    VALUES
      ('Welcome to the General room!', 1, 1),
      ('Hello everyone!', 1, 2),
      ('Let''s talk about development!', 2, 1),
      ('Great idea!', 2, 2),
      ('Random thoughts go here', 3, 2);
  `;

  // Add user preferences
  const addPreferences = `
    INSERT OR IGNORE INTO user_preferences (userId, theme)
    VALUES
      (1, 'light'),
      (2, 'dark');
  `;

  try {
    await db.serialize(async () => {
      // Begin transaction
      db.run('BEGIN TRANSACTION');

      // Execute all queries
      db.run(createUsers, [password1, password2]);
      db.run(createRooms);
      db.run(addRoomMembers);
      db.run(addMessages);
      db.run(addPreferences);

      // Commit transaction
      db.run('COMMIT');
      
      console.log('Database seeded successfully!');
    });
  } catch (error) {
    // Rollback on error
    db.run('ROLLBACK');
    console.error('Error seeding database:', error);
  }
};

// Run the seeding
seedDatabase().catch(console.error);

module.exports = { seedDatabase }; 