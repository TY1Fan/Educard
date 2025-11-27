// Load environment variables
require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// Create Express application
const app = express();

// Security middleware (MUST be early in middleware chain)
const { securityHeaders, additionalSecurityHeaders } = require("./middleware/securityHeaders");
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

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

// Request logging middleware (simple for now)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
app.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
        }
        h1 {
          font-size: 6rem;
          margin: 0;
          color: #667eea;
        }
        h2 {
          font-size: 2rem;
          margin: 1rem 0;
          color: #333;
        }
        p {
          color: #666;
        }
        a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Go back home</a></p>
      </div>
    </body>
    </html>
  `);
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN" || err.message?.toLowerCase().includes("csrf")) {
    // Render without layout by setting layout to false
    return res.status(403).render("errors/403", {
      layout: false,
      message: "Invalid security token. Please refresh the page and try again.",
    });
  }
  next(err);
});

// Error handler - must be last
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error("Error occurred:");
  console.error(err.stack);

  // Send error response
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong!"
      : err.message;

  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Educard Forum</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: 4rem;
          margin: 0;
          color: #e53e3e;
        }
        h2 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: #333;
        }
        p {
          color: #666;
        }
        pre {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          text-align: left;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Error</h1>
        <h2>Something went wrong</h2>
        <p>${message}</p>
        ${process.env.NODE_ENV !== "production" ? `<pre>${err.stack}</pre>` : ""}
        <p><a href="/">Go back home</a></p>
      </div>
    </body>
    </html>
  `);
});

// Export app for use in server.js
module.exports = app;
