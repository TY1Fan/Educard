const { validationResult, body } = require('express-validator');
const User = require('../models/User');

// Show registration form
exports.showRegister = (req, res) => {
  res.render('pages/register', {
    title: 'Register - Educard Forum',
    errors: null,
    formData: null
  });
};

// Registration validation rules
exports.registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers')
    .custom(async (value) => {
      const user = await User.findOne({ where: { username: value } });
      if (user) {
        throw new Error('Username already taken');
      }
      return true;
    }),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({ where: { email: value } });
      if (user) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Process registration
exports.register = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('pages/register', {
      title: 'Register - Educard Forum',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { username, email, password } = req.body;
    
    // Create user (password will be hashed by model hook)
    const user = await User.create({
      username,
      email,
      password
    });

    // Log user in
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    // Flash success message
    req.flash('success', 'Welcome to Educard! Your account has been created successfully.');

    // Redirect to homepage
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('pages/register', {
      title: 'Register - Educard Forum',
      errors: [{ msg: 'An error occurred during registration. Please try again.' }],
      formData: req.body
    });
  }
};

// Show login form
exports.showLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Login - Educard Forum',
    error: null,
    usernameOrEmail: ''
  });
};

// Process login
exports.login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const { Op } = require('sequelize');
    
    // Find user by username or email
    const user = await User.scope('withPassword').findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    // Generic error message (don't reveal if user exists)
    if (!user) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Invalid credentials',
        usernameOrEmail
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Invalid credentials',
        usernameOrEmail
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.render('pages/login', {
        title: 'Login - Educard Forum',
        error: 'Account is deactivated',
        usernameOrEmail
      });
    }

    // Log user in
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    // Flash success message
    req.flash('success', 'Welcome back! You have successfully logged in.');

    // Redirect to original URL or homepage
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo; // Clear the stored URL
    res.redirect(returnTo);
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', {
      title: 'Login - Educard Forum',
      error: 'An error occurred during login. Please try again.',
      usernameOrEmail
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
    // Clear the session cookie
    res.clearCookie('educard.sid');
    res.redirect('/');
  });
};
