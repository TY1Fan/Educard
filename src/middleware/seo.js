const seoUtils = require('../utils/seo');

/**
 * SEO Middleware
 * Makes SEO utility functions available to all views
 */
function seoMiddleware(req, res, next) {
  // Make SEO utilities available in views
  res.locals.seo = seoUtils;
  
  // Default SEO values
  res.locals.metaDescription = seoUtils.SITE_DESCRIPTION;
  res.locals.canonicalUrl = seoUtils.generateCanonicalUrl(req.path);
  res.locals.openGraph = null;
  res.locals.structuredData = null;
  
  next();
}

module.exports = seoMiddleware;
