const logger = require('../utils/logger');

/**
 * Performance Monitoring Middleware
 * Tracks request timing and slow queries
 */

// Configuration
const SLOW_REQUEST_THRESHOLD = process.env.SLOW_REQUEST_THRESHOLD || 1000; // ms
const LOG_ALL_REQUESTS = process.env.NODE_ENV === 'development';

// Performance metrics storage (in-memory, could be moved to Redis)
const metrics = {
  requests: [],
  slowRequests: [],
  maxSize: 1000 // Keep last 1000 requests
};

/**
 * Main performance monitoring middleware
 */
function performanceMonitor(req, res, next) {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to capture timing
  res.end = function(chunk, encoding) {
    // Calculate timing
    const hrDiff = process.hrtime(startHrTime);
    const responseTime = hrDiff[0] * 1000 + hrDiff[1] / 1000000; // Convert to milliseconds
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);

    // Collect metrics
    const requestData = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Add to metrics
    metrics.requests.push(requestData);
    if (metrics.requests.length > metrics.maxSize) {
      metrics.requests.shift();
    }

    // Track slow requests
    if (responseTime > SLOW_REQUEST_THRESHOLD) {
      metrics.slowRequests.push(requestData);
      if (metrics.slowRequests.length > metrics.maxSize) {
        metrics.slowRequests.shift();
      }

      // Log slow request
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl}`, {
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // Log all requests in development
    if (LOG_ALL_REQUESTS) {
      const color = responseTime > SLOW_REQUEST_THRESHOLD ? '\x1b[31m' : // Red
                    responseTime > 500 ? '\x1b[33m' : // Yellow
                    '\x1b[32m'; // Green
      const reset = '\x1b[0m';
      
      console.log(
        `${color}${req.method}${reset} ${req.originalUrl} - ${res.statusCode} - ${color}${responseTime.toFixed(2)}ms${reset}`
      );
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Get performance statistics
 */
function getPerformanceStats() {
  if (metrics.requests.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      requests: []
    };
  }

  const responseTimes = metrics.requests.map(r => r.responseTime);
  const sum = responseTimes.reduce((a, b) => a + b, 0);
  const avg = sum / responseTimes.length;

  // Sort by response time to find p50, p95, p99
  const sorted = [...responseTimes].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  // Group by status code
  const statusCodes = {};
  metrics.requests.forEach(r => {
    const code = r.statusCode;
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });

  // Group by path
  const pathStats = {};
  metrics.requests.forEach(r => {
    const path = r.path;
    if (!pathStats[path]) {
      pathStats[path] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      };
    }
    pathStats[path].count++;
    pathStats[path].totalTime += r.responseTime;
    pathStats[path].minTime = Math.min(pathStats[path].minTime, r.responseTime);
    pathStats[path].maxTime = Math.max(pathStats[path].maxTime, r.responseTime);
  });

  // Calculate average for each path
  Object.keys(pathStats).forEach(path => {
    pathStats[path].avgTime = pathStats[path].totalTime / pathStats[path].count;
  });

  return {
    totalRequests: metrics.requests.length,
    averageResponseTime: avg.toFixed(2),
    medianResponseTime: p50?.toFixed(2) || 0,
    p95ResponseTime: p95?.toFixed(2) || 0,
    p99ResponseTime: p99?.toFixed(2) || 0,
    slowRequests: metrics.slowRequests.length,
    slowRequestThreshold: SLOW_REQUEST_THRESHOLD,
    statusCodes,
    pathStats,
    recentSlowRequests: metrics.slowRequests.slice(-10).reverse() // Last 10 slow requests
  };
}

/**
 * Clear performance metrics
 */
function clearMetrics() {
  metrics.requests = [];
  metrics.slowRequests = [];
}

/**
 * Express route handler to expose performance stats
 */
function performanceStatsHandler(req, res) {
  const stats = getPerformanceStats();
  res.json(stats);
}

module.exports = {
  performanceMonitor,
  getPerformanceStats,
  clearMetrics,
  performanceStatsHandler
};
