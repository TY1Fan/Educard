const crypto = require('crypto');

/**
 * Simple session-based CSRF protection middleware
 * Generates and validates CSRF tokens stored in the session
 */

// Generate a new CSRF token
function generateToken(req) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfSecret;
}

// Middleware to add CSRF token to response locals
function csrfToken(req, res, next) {
  const token = generateToken(req);
  
  // Make token available to views
  res.locals.csrfToken = token;
  
  // Add helper function to request
  req.csrfToken = () => token;
  
  next();
}

// Middleware to validate CSRF tokens on state-changing requests
function csrfProtection(req, res, next) {
  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from request
  const token = req.body._csrf || req.headers['x-csrf-token'] || req.headers['csrf-token'];
  
  // Get expected token from session
  const expectedToken = req.session.csrfSecret;
  
  // Validate token
  if (!token || !expectedToken || token !== expectedToken) {
    const error = new Error('Invalid CSRF token');
    error.code = 'EBADCSRFTOKEN';
    error.statusCode = 403;
    return next(error);
  }
  
  next();
}

module.exports = {
  csrfToken,
  csrfProtection,
  generateToken,
};
