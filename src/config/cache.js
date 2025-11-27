const NodeCache = require('node-cache');

/**
 * Cache Configuration
 * Centralizes cache settings and instances for the application
 */

// Cache TTL (Time To Live) settings in seconds
const TTL = {
  CATEGORIES: 600,      // 10 minutes - rarely changes
  THREADS: 180,         // 3 minutes - moderate activity
  USER_PROFILE: 300,    // 5 minutes - occasional updates
  SEARCH_RESULTS: 120,  // 2 minutes - frequently changing
  STATISTICS: 600       // 10 minutes - for admin dashboard
};

// Create main cache instance
// stdTTL: default time-to-live for cache entries
// checkperiod: interval to check for expired entries
// useClones: clone variables to prevent reference issues
const cache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: true,
  deleteOnExpire: true
});

// Cache statistics tracking
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Wrap cache methods to track statistics
const originalGet = cache.get.bind(cache);
const originalSet = cache.set.bind(cache);
const originalDel = cache.del.bind(cache);

cache.get = function(key) {
  const value = originalGet(key);
  if (value !== undefined) {
    stats.hits++;
  } else {
    stats.misses++;
  }
  return value;
};

cache.set = function(key, value, ttl) {
  stats.sets++;
  return originalSet(key, value, ttl);
};

cache.del = function(keys) {
  stats.deletes++;
  return originalDel(keys);
};

// Get cache statistics
function getStats() {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hitRate: total > 0 ? ((stats.hits / total) * 100).toFixed(2) + '%' : '0%',
    keys: cache.keys().length
  };
}

// Reset statistics
function resetStats() {
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
}

// Cache key builders for consistent naming
const keys = {
  categories: () => 'categories:all',
  categoryThreads: (slug, page = 1) => `category:${slug}:threads:page:${page}`,
  thread: (slug) => `thread:${slug}`,
  userProfile: (username) => `user:${username}:profile`,
  searchResults: (query, page = 1) => `search:${query}:page:${page}`,
  statistics: () => 'admin:statistics',
  threadsByCategory: (categoryId) => `category:${categoryId}:threads:*`,
  userThreads: (userId) => `user:${userId}:threads`
};

// Invalidation helpers
function invalidatePattern(pattern) {
  const allKeys = cache.keys();
  const matchingKeys = allKeys.filter(key => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(key);
    }
    return key === pattern;
  });
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
    return matchingKeys.length;
  }
  return 0;
}

function invalidateCategory(categoryId, categorySlug) {
  // Invalidate category thread listings
  invalidatePattern(keys.threadsByCategory(categoryId));
  // Invalidate home page categories (since thread count changed)
  cache.del(keys.categories());
}

function invalidateThread(threadSlug) {
  // Invalidate specific thread
  cache.del(keys.thread(threadSlug));
}

function invalidateUser(username) {
  // Invalidate user profile
  cache.del(keys.userProfile(username));
}

function invalidateSearch() {
  // Invalidate all search results
  invalidatePattern('search:*');
}

module.exports = {
  cache,
  TTL,
  keys,
  getStats,
  resetStats,
  invalidatePattern,
  invalidateCategory,
  invalidateThread,
  invalidateUser,
  invalidateSearch
};
