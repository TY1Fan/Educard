const { User } = require('../models');

/**
 * Require Admin Middleware
 * Ensures the user is authenticated and has admin role
 */
const requireAdmin = async (req, res, next) => {
  // First check if user is authenticated
  if (!req.session || !req.session.user) {
    req.flash('error', 'You must be logged in to access this page');
    return res.redirect('/auth/login');
  }

  try {
    // Fetch full user with role
    const user = await User.findByPk(req.session.user.id);
    
    if (!user) {
      req.session.destroy();
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/auth/login');
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      req.flash('error', 'Access denied. Admin privileges required.');
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page. Admin privileges are required.',
        isAuthenticated: true,
        user: req.session.user,
        csrfToken: req.csrfToken()
      });
    }

    // Store full user object in request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/');
  }
};

module.exports = requireAdmin;
