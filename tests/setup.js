// Set test environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key-for-testing';

// Mock database for unit tests - integration tests will handle their own setup
global.mockDatabase = {
  connected: false
};

// Helper function to create test user (for integration tests)
global.createTestUser = async (User, userData = {}) => {
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
  
  return await User.create({
    username: userData.username || 'testuser',
    email: userData.email || 'test@example.com',
    password: hashedPassword,
    role: userData.role || 'user',
    ...userData
  });
};

// Helper function to clear all tables (for integration tests)
global.clearDatabase = async (sequelize) => {
  if (!sequelize) return;
  
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    try {
      await sequelize.models[modelName].destroy({ where: {}, force: true, truncate: true });
    } catch (error) {
      // Ignore errors for tables that don't exist yet
    }
  }
};
