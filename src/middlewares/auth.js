/**
 * Authentication Middleware
 * Protects routes and manages access based on authentication status
 */

/**
 * Require user to be authenticated
 * Redirects to login page if not authenticated
 * Stores the original URL to redirect back after login
 */
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    // Store the original URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Require user to be a guest (not logged in)
 * Redirects to home page if already authenticated
 * Useful for login/register pages
 */
exports.requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

/**
 * Check if user owns a resource
 * Returns a middleware function that checks ownership
 * @param {Function} getUserId - Function that extracts the resource owner's ID from request
 * @returns {Function} Middleware function
 */
exports.checkOwnership = (getUserId) => {
  return (req, res, next) => {
    const resourceUserId = getUserId(req);
    const currentUserId = req.session.user?.id;

    if (currentUserId !== resourceUserId) {
      return res.status(403).render('errors/403', {
        layout: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

/**
 * Optional: Check if user has specific role (for future use)
 * @param {string} role - Required role (e.g., 'admin', 'moderator')
 * @returns {Function} Middleware function
 */
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/auth/login');
    }

    if (req.session.user.role !== role) {
      return res.status(403).render('errors/403', {
        layout: false,
        message: 'You do not have permission to access this resource.'
      });
    }
    next();
  };
};
