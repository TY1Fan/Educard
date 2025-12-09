const logger = require('../utils/logger');

/**
 * Security Event Logging Middleware
 * Logs security-relevant events for audit trail
 */

// Log all authentication attempts
function logAuthAttempts(req, res, next) {
  const originalSend = res.send;

  res.send = function(data) {
    // Log login attempts
    if (req.path === '/auth/login' && req.method === 'POST') {
      const identifier = req.body.usernameOrEmail;
      
      if (res.statusCode === 200 || (typeof data === 'string' && data.includes('Dashboard'))) {
        logger.security(
          logger.SECURITY_EVENTS.LOGIN_SUCCESS,
          `Successful login for: ${identifier}`,
          req
        );
        logger.clearFailedLogins(identifier);
      } else {
        logger.security(
          logger.SECURITY_EVENTS.LOGIN_FAILURE,
          `Failed login attempt for: ${identifier}`,
          req
        );
        logger.trackFailedLogin(identifier, req);
      }
    }

    // Log registration
    if (req.path === '/auth/register' && req.method === 'POST') {
      if (res.statusCode === 200 || res.statusCode === 302) {
        logger.security(
          logger.SECURITY_EVENTS.REGISTER,
          `New user registered: ${req.body.username}`,
          req,
          { email: req.body.email }
        );
      }
    }

    // Log logout
    if (req.path === '/auth/logout') {
      logger.security(
        logger.SECURITY_EVENTS.LOGOUT,
        'User logged out',
        req
      );
    }

    originalSend.call(this, data);
  };

  next();
}

// Log unauthorized access attempts
function logUnauthorizedAccess(req, res, next) {
  if (!req.user && req.path !== '/auth/login' && req.path !== '/auth/register') {
    // Check if this is a protected route
    const protectedPaths = ['/profile', '/admin', '/category/*/new-thread', '/thread/*/reply'];
    
    const isProtected = protectedPaths.some(path => {
      const regex = new RegExp('^' + path.replace(/\*/g, '[^/]+') + '$');
      return regex.test(req.path);
    });

    if (isProtected) {
      logger.security(
        logger.SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        `Unauthorized access attempt to: ${req.path}`,
        req
      );
    }
  }

  next();
}

// Log CSRF violations
function logCsrfViolations(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.security(
      logger.SECURITY_EVENTS.CSRF_VIOLATION,
      'CSRF token validation failed',
      req,
      { error: err.message }
    );
  }
  next(err);
}

// Log suspicious input patterns (potential XSS/SQL injection)
function logSuspiciousInput(req, res, next) {
  const suspiciousPatterns = {
    xss: /<script|<img.*onerror|<svg.*onload|javascript:|onerror=|onload=/i,
    sql: /'.*OR.*'|'.*AND.*'|--|\bUNION\b|\bSELECT\b.*\bFROM\b|\bDROP\b.*\bTABLE\b/i,
    pathTraversal: /\.\.[\/\\]|\.\.%2[fF]/,
    commandInjection: /[;&|`$()]/
  };

  const checkInput = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const currentPath = path ? `${path}.${key}` : key;
        
        for (const [type, pattern] of Object.entries(suspiciousPatterns)) {
          if (pattern.test(value)) {
            logger.security(
              type === 'xss' ? logger.SECURITY_EVENTS.XSS_ATTEMPT :
              type === 'sql' ? logger.SECURITY_EVENTS.SQL_INJECTION_ATTEMPT :
              logger.SECURITY_EVENTS.INVALID_INPUT,
              `Suspicious ${type} pattern detected in input`,
              req,
              {
                field: currentPath,
                value: value.substring(0, 100), // Log first 100 chars
                pattern_type: type
              }
            );
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        checkInput(value, path ? `${path}.${key}` : key);
      }
    }
  };

  // Check all input sources
  if (req.body && Object.keys(req.body).length > 0) {
    checkInput(req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    checkInput(req.query);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    checkInput(req.params);
  }

  next();
}

// Log permission denied events
function logPermissionDenied(req, res, next) {
  const originalStatus = res.status.bind(res);

  res.status = function(code) {
    if (code === 403) {
      logger.security(
        logger.SECURITY_EVENTS.PERMISSION_DENIED,
        `Permission denied for: ${req.path}`,
        req,
        { required_role: req.requiredRole || 'unknown' }
      );
    }
    return originalStatus(code);
  };

  next();
}

// Log admin actions
function logAdminActions(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    const adminPaths = ['/admin', '/user/ban', '/user/unban', '/thread/delete', '/post/delete'];
    
    const isAdminAction = adminPaths.some(path => req.path.startsWith(path));
    
    if (isAdminAction) {
      logger.auditAdmin(
        `${req.method} ${req.path}`,
        req,
        {
          body: req.body,
          params: req.params
        }
      );
    }
  }

  next();
}

// Detect session hijacking attempts
function detectSessionHijacking(req, res, next) {
  if (req.session && req.user) {
    // Store initial user agent and IP
    if (!req.session.userAgent) {
      req.session.userAgent = req.get('user-agent');
      req.session.ipAddress = req.ip;
    } else {
      // Check if user agent or IP changed significantly
      const currentUA = req.get('user-agent');
      const currentIP = req.ip;

      if (req.session.userAgent !== currentUA || req.session.ipAddress !== currentIP) {
        logger.security(
          logger.SECURITY_EVENTS.SESSION_HIJACK_ATTEMPT,
          'Possible session hijacking detected',
          req,
          {
            original_ip: req.session.ipAddress,
            current_ip: currentIP,
            original_ua: req.session.userAgent,
            current_ua: currentUA
          }
        );

        // In production, you might want to invalidate the session
        // req.session.destroy();
        // return res.redirect('/auth/login');
      }
    }
  }

  next();
}

// Combine all security logging middleware
function securityLogging() {
  return [
    logAuthAttempts,
    logUnauthorizedAccess,
    logSuspiciousInput,
    logPermissionDenied,
    logAdminActions,
    detectSessionHijacking
  ];
}

module.exports = {
  securityLogging,
  logAuthAttempts,
  logUnauthorizedAccess,
  logCsrfViolations,
  logSuspiciousInput,
  logPermissionDenied,
  logAdminActions,
  detectSessionHijacking,
  logger
};
