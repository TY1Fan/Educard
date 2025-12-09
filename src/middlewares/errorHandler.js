const logger = require('../utils/logger');
const path = require('path');

/**
 * Comprehensive Error Handler Middleware
 * Handles all application errors with proper logging and user-friendly responses
 */

/**
 * Custom Application Error Class
 * Allows creating errors with specific status codes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Flag to distinguish operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Handler
 * Must be placed after all route definitions
 */
function notFoundHandler(req, res, next) {
  // Log 404 for monitoring
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    user: req.session?.user?.username || 'anonymous'
  });

  // Render 404 page
  res.status(404).render('errors/404', {
    layout: false,
    title: 'Page Not Found',
    message: `The page "${req.originalUrl}" does not exist.`,
    url: req.originalUrl
  });
}

/**
 * CSRF Error Handler
 * Handles CSRF token validation failures
 */
function csrfErrorHandler(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.toLowerCase().includes('csrf')) {
    logger.security(
      logger.SECURITY_EVENTS.CSRF_VIOLATION,
      'CSRF token validation failed',
      req,
      { error: err.message }
    );

    return res.status(403).render('errors/403', {
      layout: false,
      title: 'Security Error',
      message: 'Invalid security token. Please refresh the page and try again.',
      code: 'CSRF_ERROR'
    });
  }
  next(err);
}

/**
 * Validation Error Handler
 * Handles express-validator errors
 */
function validationErrorHandler(err, req, res, next) {
  if (err.array && typeof err.array === 'function') {
    // express-validator errors
    const errors = err.array();
    
    logger.warn('Validation error', {
      url: req.originalUrl,
      method: req.method,
      errors: errors.map(e => ({ field: e.param, message: e.msg }))
    });

    // If it's an API request, return JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors
      });
    }

    // For web requests, render error page
    return res.status(400).render('errors/400', {
      layout: false,
      title: 'Validation Error',
      message: 'The submitted data is invalid.',
      errors: errors
    });
  }
  next(err);
}

/**
 * Database Error Handler
 * Handles Sequelize/Database errors
 */
function databaseErrorHandler(err, req, res, next) {
  // Sequelize errors
  if (err.name === 'SequelizeValidationError' || 
      err.name === 'SequelizeUniqueConstraintError' ||
      err.name === 'SequelizeDatabaseError') {
    
    logger.error('Database error', {
      type: err.name,
      message: err.message,
      url: req.originalUrl,
      method: req.method
    });

    const message = err.name === 'SequelizeUniqueConstraintError' 
      ? 'A record with this information already exists.'
      : 'A database error occurred.';

    return res.status(400).render('errors/500', {
      layout: false,
      title: 'Database Error',
      message: process.env.NODE_ENV === 'production' ? message : err.message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
  next(err);
}

/**
 * Global Error Handler
 * Catches all unhandled errors
 */
function globalErrorHandler(err, req, res, next) {
  // Default status code
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err.isOperational || false;

  // Log error with full context
  const errorLog = {
    message: err.message,
    stack: err.stack,
    statusCode: statusCode,
    isOperational: isOperational,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.session?.user?.id,
    username: req.session?.user?.username,
    body: sanitizeBody(req.body),
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server error', errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client error', errorLog);
  }

  // Determine error message to show
  let message;
  let title;

  if (process.env.NODE_ENV === 'production') {
    // Production: Generic messages
    if (statusCode === 403) {
      title = 'Forbidden';
      message = 'You do not have permission to access this resource.';
    } else if (statusCode === 404) {
      title = 'Not Found';
      message = 'The requested resource was not found.';
    } else if (statusCode >= 500) {
      title = 'Server Error';
      message = 'An unexpected error occurred. Please try again later.';
    } else {
      title = 'Error';
      message = 'An error occurred while processing your request.';
    }
  } else {
    // Development: Detailed messages
    title = err.name || 'Error';
    message = err.message;
  }

  // Handle different response formats
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    // JSON response for API requests
    return res.status(statusCode).json({
      error: {
        message: message,
        statusCode: statusCode,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: err.stack,
          details: err.details
        })
      }
    });
  }

  // Select appropriate error template
  let template = 'errors/500';
  if (statusCode === 403) template = 'errors/403';
  else if (statusCode === 404) template = 'errors/404';
  else if (statusCode === 429) template = 'errors/429';

  // Render error page
  res.status(statusCode).render(template, {
    layout: false,
    title: title,
    message: message,
    statusCode: statusCode,
    error: process.env.NODE_ENV === 'production' ? {} : err,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

/**
 * Unhandled Rejection Handler
 * Catches promise rejections that weren't handled
 */
function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason,
      promise: promise,
      stack: reason?.stack
    });

    // In production, you might want to gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: Unhandled promise rejection. Server should be restarted.');
      // process.exit(1); // Uncomment if you want to crash on unhandled rejections
    }
  });
}

/**
 * Uncaught Exception Handler
 * Catches synchronous errors that weren't caught
 */
function setupUncaughtExceptionHandler() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });

    console.error('FATAL: Uncaught exception. Shutting down...');
    process.exit(1); // Must exit on uncaught exception
  });
}

/**
 * Sanitize request body for logging
 * Removes sensitive fields like passwords
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'confirmPassword', 'oldPassword', 'newPassword', 'token', 'secret'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create operational error
 * For known, expected errors
 */
function createError(message, statusCode = 500, details = null) {
  return new AppError(message, statusCode, details);
}

module.exports = {
  AppError,
  notFoundHandler,
  csrfErrorHandler,
  validationErrorHandler,
  databaseErrorHandler,
  globalErrorHandler,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
  asyncHandler,
  createError
};
