const { cache, keys, TTL } = require('../config/cache');

/**
 * Cache Middleware
 * Express middleware for caching route responses
 */

/**
 * Generic cache middleware factory
 * Creates middleware that caches responses based on a key generator
 * 
 * @param {Function} keyGenerator - Function that generates cache key from req
 * @param {Number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
function cacheMiddleware(keyGenerator, ttl) {
  return async (req, res, next) => {
    // Skip caching for authenticated users to avoid showing stale data
    // Moderators and admins should see real-time updates
    if (req.session && req.session.userId) {
      return next();
    }

    const key = keyGenerator(req);
    const cachedData = cache.get(key);

    if (cachedData) {
      // Cache hit - send cached response
      return res.send(cachedData);
    }

    // Cache miss - intercept response
    const originalSend = res.send.bind(res);
    res.send = function(body) {
      // Only cache successful HTML responses
      if (res.statusCode === 200 && res.get('Content-Type')?.includes('text/html')) {
        cache.set(key, body, ttl);
      }
      originalSend(body);
    };

    next();
  };
}

/**
 * Cache home page (categories list)
 */
function cacheHome() {
  return cacheMiddleware(
    () => keys.categories(),
    TTL.CATEGORIES
  );
}

/**
 * Cache category thread listings
 */
function cacheCategory() {
  return cacheMiddleware(
    (req) => keys.categoryThreads(req.params.slug, req.query.page || 1),
    TTL.THREADS
  );
}

/**
 * Cache individual thread view
 */
function cacheThread() {
  return cacheMiddleware(
    (req) => keys.thread(req.params.slug),
    TTL.THREADS
  );
}

/**
 * Cache user profile
 */
function cacheUserProfile() {
  return cacheMiddleware(
    (req) => keys.userProfile(req.params.username),
    TTL.USER_PROFILE
  );
}

/**
 * Cache search results
 */
function cacheSearch() {
  return cacheMiddleware(
    (req) => keys.searchResults(req.query.q, req.query.page || 1),
    TTL.SEARCH_RESULTS
  );
}

/**
 * Don't cache - middleware to explicitly skip caching
 * Useful for routes that should never be cached
 */
function noCache() {
  return (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  };
}

module.exports = {
  cacheMiddleware,
  cacheHome,
  cacheCategory,
  cacheThread,
  cacheUserProfile,
  cacheSearch,
  noCache
};
