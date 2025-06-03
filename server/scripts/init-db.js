const { db } = require('../db');
const { seedDatabase } = require('../db/seed');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Wait for database tables to be created
    await new Promise((resolve) => {
      db.serialize(() => {
        console.log('Creating database tables...');
        resolve();
      });
    });

    // Seed the database with test data
    console.log('Seeding database with test data...');
    await seedDatabase();

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 