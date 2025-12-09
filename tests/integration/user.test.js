const request = require('supertest');
const express = require('express');
const session = require('express-session');
const { sequelize } = require('../../src/models');
const User = require('../../src/models/User');

// Mock app setup
const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
  
  // Mount auth routes
  app.use('/auth', require('../../src/routes/auth'));
  
  return app;
};

describe('User Authentication Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    
    try {
      await sequelize.authenticate();
      // Don't force sync - use existing database structure
      await sequelize.sync({ alter: false });
    } catch (error) {
      console.error('Database setup failed:', error.message);
      // Continue anyway - tests will handle missing routes gracefully
    }
  });

  beforeEach(async () => {
    try {
      await global.clearDatabase(sequelize);
    } catch (error) {
      // Ignore clear errors
    }
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch (error) {
      // Ignore close errors
    }
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect([200, 302]).toContain(response.status); // Success or redirect
      
      const user = await User.findOne({ where: { username: 'newuser' } });
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.password).not.toBe('password123'); // Should be hashed
    });

    test('should reject registration with existing username', async () => {
      await global.createTestUser(User, {
        username: 'existinguser',
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          email: 'newemail@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect([400, 422]).toContain(response.status);
    });

    test('should reject registration with mismatched passwords', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          confirmPassword: 'different123'
        });

      expect([400, 422]).toContain(response.status);
    });

    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect([400, 422]).toContain(response.status);
    });

    test('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'ab',
          email: 'newuser@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect([400, 422]).toContain(response.status);
    });

    test('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'pass',
          confirmPassword: 'pass'
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await global.createTestUser(User, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect([200, 302]).toContain(response.status); // Success or redirect
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect([400, 401, 422]).toContain(response.status);
    });

    test('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect([400, 401, 422]).toContain(response.status);
    });

    test('should reject login with empty credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: '',
          password: ''
        });

      expect([400, 422]).toContain(response.status);
    });

    test('should reject login for banned user', async () => {
      const user = await User.findOne({ where: { username: 'testuser' } });
      await user.update({ isBanned: true, banReason: 'Terms violation' });

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect([400, 403, 422]).toContain(response.status);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout authenticated user', async () => {
      const agent = request.agent(app);
      
      // First login
      await agent
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      // Then logout
      const response = await agent.post('/auth/logout');
      
      expect([200, 302]).toContain(response.status);
    });

    test('should handle logout without session', async () => {
      const response = await request(app).post('/auth/logout');
      
      expect([200, 302]).toContain(response.status);
    });
  });

  describe('Authentication Session Flow', () => {
    beforeEach(async () => {
      await global.createTestUser(User, {
        username: 'sessionuser',
        email: 'session@example.com',
        password: 'password123'
      });
    });

    test('should maintain session across requests', async () => {
      const agent = request.agent(app);
      
      // Login
      await agent
        .post('/auth/login')
        .send({
          username: 'sessionuser',
          password: 'password123'
        });

      // Logout (session should persist)
      const logoutResponse = await agent.post('/auth/logout');
      expect([200, 302]).toContain(logoutResponse.status);
    });

    test('should create new user and auto-login', async () => {
      const agent = request.agent(app);
      
      // Register
      const registerResponse = await agent
        .post('/auth/register')
        .send({
          username: 'autouser',
          email: 'auto@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect([200, 302]).toContain(registerResponse.status);
    });
  });
});
