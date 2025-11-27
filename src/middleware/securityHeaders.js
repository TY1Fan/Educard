const helmet = require('helmet');

/**
 * Security Headers Middleware
 * Configures Helmet.js to set secure HTTP headers
 */

const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Needed for inline scripts in EJS
        "https://cdn.jsdelivr.net", // For highlight.js, marked.js
        "https://unpkg.com" // For DOMPurify
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Needed for inline styles
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:", // For inline images
        "https:", // Allow HTTPS images
        "http:" // Allow HTTP images (for user avatars, etc.)
      ],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [] // Upgrade HTTP to HTTPS
    }
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Allow embedding content
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

  // Other security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hidePoweredBy: true, // Hide X-Powered-By header
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true, // Prevent MIME type sniffing
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true // Enable XSS filter
});

/**
 * Additional security headers
 * Custom headers not covered by Helmet
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent caching of sensitive pages
  if (req.path.startsWith('/admin') || req.path.startsWith('/profile/edit')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  // Add custom security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');

  // Permissions Policy (formerly Feature-Policy)
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

module.exports = {
  securityHeaders,
  additionalSecurityHeaders
};
