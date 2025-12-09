const bcrypt = require('bcrypt');

describe('Password Hashing', () => {
  describe('bcrypt hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      session: {},
      originalUrl: '/test-url'
    };
    mockRes = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn()
    };
    mockNext = jest.fn();
    
    // Clear module cache to allow fresh mocks
    jest.resetModules();
  });

  describe('requireAuth', () => {
    test('should call next() for authenticated user', async () => {
      mockReq.session.user = { id: 1, username: 'testuser' };
      
      // Mock User model before requiring auth middleware
      jest.doMock('../../src/models/User', () => ({
        findByPk: jest.fn().mockResolvedValue({
          id: 1,
          username: 'testuser',
          isBanned: false
        })
      }));

      const auth = require('../../src/middlewares/auth');
      await auth.requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to login for unauthenticated user', async () => {
      mockReq.session.user = null;
      const auth = require('../../src/middlewares/auth');

      await auth.requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
      expect(mockReq.session.returnTo).toBe('/test-url');
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject banned user', async () => {
      mockReq.session.user = { id: 1, username: 'banneduser' };
      mockReq.session.destroy = jest.fn();
      
      // Mock User model with banned user
      jest.doMock('../../src/models/User', () => ({
        findByPk: jest.fn().mockResolvedValue({
          id: 1,
          username: 'banneduser',
          isBanned: true,
          banReason: 'Violation of terms'
        })
      }));

      const auth = require('../../src/middlewares/auth');
      await auth.requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockReq.session.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('errors/403', expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireGuest', () => {
    test('should call next() for unauthenticated user', () => {
      mockReq.session.user = null;
      const auth = require('../../src/middlewares/auth');

      auth.requireGuest(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    test('should redirect to home for authenticated user', () => {
      mockReq.session.user = { id: 1, username: 'testuser' };
      const auth = require('../../src/middlewares/auth');

      auth.requireGuest(mockReq, mockRes, mockNext);
      
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkOwnership', () => {
    test('should call next() when user owns resource', () => {
      mockReq.session.user = { id: 1, username: 'testuser' };
      const auth = require('../../src/middlewares/auth');
      const getUserId = (req) => 1;
      const middleware = auth.checkOwnership(getUserId);

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject when user does not own resource', () => {
      mockReq.session.user = { id: 1, username: 'testuser' };
      const auth = require('../../src/middlewares/auth');
      const getUserId = (req) => 2; // Different user ID
      const middleware = auth.checkOwnership(getUserId);

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('errors/403', expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject when user not authenticated', () => {
      mockReq.session.user = null;
      const auth = require('../../src/middlewares/auth');
      const getUserId = (req) => 1;
      const middleware = auth.checkOwnership(getUserId);

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    test('should call next() when user has required role', () => {
      mockReq.session.user = { id: 1, role: 'admin' };
      const auth = require('../../src/middlewares/auth');
      const middleware = auth.requireRole('admin');

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject when user lacks required role', () => {
      mockReq.session.user = { id: 1, role: 'user' };
      const auth = require('../../src/middlewares/auth');
      const middleware = auth.requireRole('admin');

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('errors/403', expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should redirect to login when user not authenticated', () => {
      mockReq.session.user = null;
      const auth = require('../../src/middlewares/auth');
      const middleware = auth.requireRole('admin');

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
      expect(mockReq.session.returnTo).toBe('/test-url');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
