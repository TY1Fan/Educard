# Educard Automated Testing Guide

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests (fast, ~1 second)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML report:

```bash
# On macOS
open coverage/index.html

# On Linux
xdg-open coverage/index.html

# Or navigate to: coverage/index.html in your browser
```

## Test Structure

```
tests/
├── setup.js              # Global test configuration
├── unit/                 # Unit tests (fast, no database)
│   ├── auth.test.js      # Authentication tests (15 tests)
│   └── validation.test.js # Validation tests (27 tests)
└── integration/          # Integration tests (slower, uses database)
    └── user.test.js      # User authentication flow tests
```

## Writing New Tests

### Unit Test Example

```javascript
// tests/unit/myFeature.test.js

describe('My Feature', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  test('should handle edge cases', () => {
    expect(myFunction(null)).toBe('');
    expect(myFunction('')).toBe('');
  });
});
```

### Integration Test Example

```javascript
// tests/integration/myEndpoint.test.js

const request = require('supertest');
const { sequelize } = require('../../src/models');

describe('My Endpoint Tests', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await global.clearDatabase(sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should return data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## Test Helpers

### Global Helpers (available in all tests)

```javascript
// Create a test user
const user = await global.createTestUser(User, {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user'
});

// Clear all database tables
await global.clearDatabase(sequelize);
```

### Mocking Examples

```javascript
// Mock a function
const mockFn = jest.fn();
mockFn.mockReturnValue('mocked value');

// Mock a module
jest.doMock('../../src/models/User', () => ({
  findByPk: jest.fn().mockResolvedValue({ id: 1, username: 'test' })
}));

// Mock request/response objects
const mockReq = {
  session: { user: { id: 1 } },
  body: { username: 'test' }
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  redirect: jest.fn()
};

const mockNext = jest.fn();
```

## Testing Best Practices

### 1. Test Names Should Be Descriptive

✅ **Good**:
```javascript
test('should return 401 when user is not authenticated', () => {});
```

❌ **Bad**:
```javascript
test('auth test', () => {});
```

### 2. Follow AAA Pattern (Arrange-Act-Assert)

```javascript
test('should hash password correctly', async () => {
  // Arrange
  const password = 'testPassword123';
  
  // Act
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Assert
  expect(hashedPassword).toBeDefined();
  expect(hashedPassword).not.toBe(password);
});
```

### 3. Test Edge Cases

```javascript
test('should handle empty input', () => {
  expect(myFunction('')).toBe('');
  expect(myFunction(null)).toBe('');
  expect(myFunction(undefined)).toBe('');
});
```

### 4. Keep Tests Independent

```javascript
// ✅ Good: Each test clears its own state
beforeEach(async () => {
  await global.clearDatabase(sequelize);
});

// ❌ Bad: Tests depend on each other
test('create user', () => { /* creates user */ });
test('login user', () => { /* assumes user exists */ });
```

### 5. Use Descriptive Variables

```javascript
// ✅ Good
const authenticatedUser = { id: 1, role: 'user' };
const expectedStatusCode = 200;

// ❌ Bad
const u = { id: 1, role: 'user' };
const x = 200;
```

## Common Jest Matchers

```javascript
// Equality
expect(value).toBe(expected);            // Strict equality (===)
expect(value).toEqual(expected);         // Deep equality
expect(value).not.toBe(expected);        // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3);          // Floating point

// Strings
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);
```

## Debugging Tests

### Run Specific Test File

```bash
npm test tests/unit/auth.test.js
```

### Run Specific Test Suite

```bash
npm test -- -t "Authentication Middleware"
```

### Run Specific Test

```bash
npm test -- -t "should hash password correctly"
```

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Debug with VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Set breakpoints and press F5 to debug.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: educard_user
          POSTGRES_PASSWORD: securepassword
          POSTGRES_DB: educard_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_USER: educard_user
          DB_PASSWORD: securepassword
          DB_NAME: educard_db
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Timeout

**Problem**: Tests hang and timeout after 10 seconds

**Solutions**:
```javascript
// Increase timeout for specific test
test('slow operation', async () => {
  // Test code
}, 30000); // 30 second timeout

// Increase global timeout in jest.config.js
module.exports = {
  testTimeout: 30000
};
```

### Database Connection Errors

**Problem**: Cannot connect to database in tests

**Solutions**:
1. Check `NODE_ENV=test` is set
2. Verify test database configuration in `src/config/database.js`
3. Ensure Docker containers are running: `docker ps`
4. Check database credentials in `.env`

### Module Not Found Errors

**Problem**: `Cannot find module '../src/...'`

**Solutions**:
1. Check file paths are correct (relative to test file)
2. Verify files exist in `src/` directory
3. Clear Jest cache: `npm test -- --clearCache`

### Mock Not Working

**Problem**: Mocks not being applied

**Solutions**:
```javascript
// Reset modules between tests
beforeEach(() => {
  jest.resetModules();
});

// Use doMock instead of mock
jest.doMock('../../src/models/User', () => ({
  findByPk: jest.fn()
}));
```

## Test Coverage Goals

| Category | Target | Current Status |
|----------|--------|----------------|
| Statements | 70% | 2.54% |
| Branches | 70% | 2.65% |
| Functions | 70% | 4.09% |
| Lines | 70% | 2.4% |

**Priority Files to Test**:
1. `src/controllers/authController.js` (0% coverage)
2. `src/controllers/forumController.js` (0% coverage)
3. `src/middlewares/validation.js` (0% coverage)
4. `src/models/User.js` (0% coverage)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Jest Matchers Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues with tests:
1. Check this guide first
2. Review test examples in `tests/unit/` and `tests/integration/`
3. Search existing test files for similar patterns
4. Consult Jest documentation for specific matchers or features

---

**Last Updated**: 2024-01-XX  
**Test Framework**: Jest v29+  
**Total Tests**: 42 (all unit tests passing)
