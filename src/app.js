// Load environment variables
require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const compression = require("compression");

// Create Express application
const app = express();

// Compression middleware (gzip) - MUST be early
app.use(compression({
  level: 6, // Compression level (0-9, 6 is default)
  threshold: 1024, // Only compress if response is larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// Security middleware (MUST be early in middleware chain)
const { securityHeaders, additionalSecurityHeaders } = require("./middleware/securityHeaders");
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

// Make utility functions available to all templates
const { getUserAvatar, getAvatarSize } = require("./utils/avatar");
app.locals.getUserAvatar = getUserAvatar;
app.locals.getAvatarSize = getAvatarSize;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Layout configuration
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Static files middleware with cache headers
// Cache static assets for 1 week (604800 seconds)
app.use(express.static(path.join(__dirname, "../public"), {
  maxAge: '7d', // 7 days
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set cache control headers based on file type
    if (path.endsWith('.html')) {
      // HTML files - no cache or short cache
      res.setHeader('Cache-Control', 'public, max-age=0');
    } else if (path.endsWith('.css') || path.endsWith('.js')) {
      // CSS and JS files - cache for 1 week
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)) {
      // Images - cache for 1 month
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    } else if (path.match(/\.(woff|woff2|ttf|eot)$/)) {
      // Fonts - cache for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
const sessionMiddleware = require("./config/session");
app.use(sessionMiddleware);

// Flash messages (after session middleware)
const flash = require("connect-flash");
app.use(flash());

// CSRF protection (session-based)
const { csrfToken, csrfProtection } = require("./middlewares/csrf");
app.use(csrfToken); // Generate token for all requests
app.use(csrfProtection); // Validate token on state-changing requests

// Security logging middleware
const { securityLogging, logCsrfViolations } = require("./middlewares/securityLogging");
app.use(securityLogging());

// Error handling middleware
const {
  notFoundHandler,
  csrfErrorHandler,
  validationErrorHandler,
  databaseErrorHandler,
  globalErrorHandler,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler,
} = require("./middlewares/errorHandler");

// Setup process-level error handlers
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

// SEO middleware - makes SEO utilities available to all views
const seoMiddleware = require("./middleware/seo");
app.use(seoMiddleware);

// Make session user and flash messages available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.successMessage = req.flash("success");
  res.locals.errorMessage = req.flash("error");
  res.locals.infoMessage = req.flash("info");
  
  // Add current path for active navigation highlighting
  res.locals.currentPath = req.path;
  
  // Add role helper functions for templates
  res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
  res.locals.isModerator = req.session.user && (req.session.user.role === 'moderator' || req.session.user.role === 'admin');
  res.locals.hasRole = function(role) {
    if (!req.session.user) return false;
    if (Array.isArray(role)) {
      return role.includes(req.session.user.role);
    }
    return req.session.user.role === role;
  };
  
  next();
});

// Performance monitoring middleware
const { performanceMonitor } = require("./middlewares/performanceMonitor");
app.use(performanceMonitor);

// Controllers
const forumController = require("./controllers/forumController");

// Cache middleware
const { cacheHome } = require("./middleware/cache");

// Homepage route (with cache)
app.get("/", cacheHome(), forumController.showHome);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Performance stats endpoint (admin only in production)
const { performanceStatsHandler } = require("./middlewares/performanceMonitor");
app.get("/performance-stats", (req, res, next) => {
  // In production, require admin access
  if (process.env.NODE_ENV === 'production') {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  performanceStatsHandler(req, res);
});

// Session test endpoint (temporary - for testing)
app.get("/test-session", (req, res) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  
  res.json({
    message: "Session working",
    views: req.session.views,
    sessionID: req.sessionID,
    authenticated: res.locals.isAuthenticated
  });
});

// Mount routes
const authRoutes = require("./routes/auth");
const forumRoutes = require("./routes/forum");
const userRoutes = require("./routes/users");
const searchRoutes = require("./routes/search");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const moderationRoutes = require("./routes/moderation");
const sitemapRoutes = require("./routes/sitemap");

app.use("/auth", authRoutes);
app.use("/search", searchRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminRoutes);
app.use("/moderation", moderationRoutes);
app.use("/", sitemapRoutes);
app.use("/", forumRoutes);
app.use("/", userRoutes);

// Test route for authentication middleware
const { requireAuth } = require("./middlewares/auth");
app.get("/protected", requireAuth, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.session.user
  });
});

// Test route to view navigation when logged in
app.get("/test-nav", requireAuth, (req, res) => {
  res.render("pages/test-nav", {
    title: "Test Navigation - Educard Forum"
  });
});

// 404 handler - must be after all other routes
app.use(notFoundHandler);

// CSRF error handler (with logging)
app.use(logCsrfViolations);
app.use(csrfErrorHandler);

// Error handlers - must be last
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(globalErrorHandler);

// Export app for use in server.js
module.exports = app;
