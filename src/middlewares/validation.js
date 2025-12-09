/**
 * Server-side validation middleware
 * Comprehensive validation rules for all forms
 */

const { body, validationResult } = require('express-validator');
const createDOMPurify = require('isomorphic-dompurify');

// Sanitize HTML to prevent XSS
const sanitizeHtml = (value) => {
  return createDOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    KEEP_CONTENT: true
  });
};

/**
 * User registration validation
 */
exports.registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(sanitizeHtml)
    .escape(),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

/**
 * User login validation
 */
exports.loginValidation = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required')
    .customSanitizer(sanitizeHtml)
    .escape(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Thread creation validation
 */
exports.threadValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Thread title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters')
    .customSanitizer(sanitizeHtml)
    .escape(),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Thread content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be 10-10,000 characters')
    .customSanitizer(sanitizeHtml),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Please select a category')
    .isInt()
    .withMessage('Invalid category selected')
    .toInt()
];

/**
 * Post/Reply creation validation
 */
exports.postValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be 10-10,000 characters')
    .customSanitizer(sanitizeHtml)
];

/**
 * Category creation validation
 */
exports.categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be 3-100 characters')
    .customSanitizer(sanitizeHtml)
    .escape(),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Category description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters')
    .customSanitizer(sanitizeHtml)
];

/**
 * Profile update validation
 */
exports.profileValidation = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .customSanitizer(sanitizeHtml),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
    .customSanitizer(sanitizeHtml)
    .escape(),
  
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL')
    .isLength({ max: 255 })
    .withMessage('URL is too long')
];

/**
 * Search query validation
 */
exports.searchValidation = [
  body('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters')
    .customSanitizer(sanitizeHtml)
    .escape()
];

/**
 * Report validation
 */
exports.reportValidation = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Please provide a reason for reporting')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be 10-500 characters')
    .customSanitizer(sanitizeHtml)
];

/**
 * Validation result handler middleware
 * Use this after validation rules to handle errors
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Store errors in session for rendering
    req.validationErrors = errors.array();
    
    // Also make them available in flash for single-use
    const errorMessages = errors.array().map(err => err.msg);
    req.flash('error', errorMessages.join(', '));
    
    return next('validation_error');
  }
  
  next();
};

/**
 * Edge case testing validation
 * Tests various attack vectors and edge cases
 */
exports.testEdgeCases = {
  // SQL injection attempts
  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--"
  ],
  
  // XSS attempts
  xssAttempts: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(\'xss\')">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>'
  ],
  
  // Unicode and special characters
  specialChars: [
    '你好世界',
    '🎉🎊🎈',
    'Héllo Wörld',
    '¯\\_(ツ)_/¯',
    '™®©',
    '\u0000\u0001\u0002' // Null bytes
  ],
  
  // Very long inputs
  longInput: 'a'.repeat(100000),
  
  // Empty and whitespace
  emptyStrings: [
    '',
    ' ',
    '   ',
    '\t\n\r'
  ],
  
  // Path traversal
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '....//....//....//etc/passwd'
  ]
};

/**
 * Sanitize user input - additional layer
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes
  input = input.replace(/\0/g, '');
  
  // Normalize whitespace
  input = input.replace(/\s+/g, ' ').trim();
  
  // Remove control characters
  input = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  return input;
};

/**
 * Validate and sanitize all request body fields
 */
exports.sanitizeAllFields = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = exports.sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};

/**
 * Check for suspicious patterns
 */
exports.checkSuspiciousPatterns = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /\bOR\b.*=.*\b/i, // SQL OR statements
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i
  ];
  
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };
  
  // Check all body fields
  if (req.body) {
    for (const key in req.body) {
      if (checkValue(req.body[key])) {
        console.warn('Suspicious pattern detected:', {
          field: key,
          value: req.body[key],
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        
        req.flash('error', 'Invalid input detected. Please check your submission.');
        return res.redirect('back');
      }
    }
  }
  
  next();
};

/**
 * Rate limit validation - prevent spam
 */
exports.validateRateLimit = (maxAttempts = 5, windowMs = 60000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key);
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      req.flash('error', 'Too many attempts. Please try again later.');
      return res.status(429).render('errors/429', {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment and try again.'
      });
    }
    
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);
    
    next();
  };
};
