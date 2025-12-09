# Performance Testing Suite

Comprehensive performance testing and monitoring tools for the Educard forum application.

## Test Scripts

### 1. `performance-test.sh`
Automated performance testing with 15 tests across 6 categories.

**Usage:**
```bash
./tests/performance/performance-test.sh
```

**What it tests:**
- ✅ Page load times (6 pages)
- ✅ Static asset delivery (4 files)
- ✅ Concurrent request handling (10 simultaneous)
- ✅ Database query performance (5 sequential)
- ✅ Cache effectiveness
- ✅ Resource sizes and compression

**Thresholds:**
- **Fast:** < 500ms (🟢 Green)
- **Good:** 500-1000ms (🔵 Blue)
- **Acceptable:** 1000-2000ms (🟡 Yellow)
- **Slow:** > 2000ms (🔴 Red)

**Example Output:**
```
==========================================
Performance Test Summary
==========================================

Total Tests: 15
Fast (<500ms): 9
Good (<1000ms): 2
Acceptable (<2000ms): 1
Slow/Failed (>2000ms or error): 3

Performance Score: 73% - Good
```

### 2. `seed-large-dataset.js`
Creates large dataset for stress testing and performance validation.

**Usage:**
```bash
docker-compose exec app node tests/performance/seed-large-dataset.js
```

**What it creates:**
- 100 test users (with bcrypt hashed passwords)
- 500 test threads (distributed across categories)
- 2000 test posts (4 posts per thread average)
- Realistic timestamps (last 60-90 days)
- Random data for variety

**Data Distribution:**
- Threads distributed across all categories
- Posts spread across all threads
- Users vary in activity levels
- View counts randomized (0-1000)

## Performance Monitoring

### Real-Time Monitoring

**Performance middleware** automatically tracks:
- Request timing (high-resolution)
- Response times per path
- Slow request detection
- Status code distribution
- Per-path statistics

**Console Output (Development):**
```
GET / - 200 - 27.45ms
GET /css/style.css - 200 - 2.33ms
GET /js/form-loading.js - 200 - 1.89ms
```

**Slow Request Alerts:**
```
[WARN] Slow request detected: GET /category/general
  responseTime: 1234.56ms
  statusCode: 200
  ip: 127.0.0.1
```

### Performance Stats API

**Endpoint:** `GET /performance-stats`

**Access:**
- Development: Public
- Production: Admin only

**Response:**
```json
{
  "totalRequests": 100,
  "averageResponseTime": "23.45",
  "medianResponseTime": "18.23",
  "p95ResponseTime": "56.78",
  "p99ResponseTime": "89.12",
  "slowRequests": 2,
  "slowRequestThreshold": 1000,
  "statusCodes": {
    "200": 85,
    "404": 10,
    "302": 5
  },
  "pathStats": {
    "/": {
      "count": 45,
      "avgTime": 25.67,
      "minTime": 12.34,
      "maxTime": 78.90
    },
    "/category/general": {
      "count": 30,
      "avgTime": 15.23,
      "minTime": 8.45,
      "maxTime": 45.67
    }
  },
  "recentSlowRequests": [
    {
      "method": "GET",
      "url": "/search?q=test",
      "responseTime": 1234.56,
      "statusCode": 200,
      "timestamp": "2025-12-09T14:30:45.123Z"
    }
  ]
}
```

**Usage:**
```bash
# View performance stats
curl http://localhost:3000/performance-stats | jq

# Monitor specific metrics
curl -s http://localhost:3000/performance-stats | jq '.averageResponseTime'

# Check for slow requests
curl -s http://localhost:3000/performance-stats | jq '.slowRequests'
```

## Performance Benchmarks

### Target Response Times

| Page Type | Target | Current | Status |
|-----------|--------|---------|--------|
| Simple pages | < 50ms | 7-8ms | ✅ Excellent |
| Homepage | < 100ms | 20-27ms | ✅ Excellent |
| Category pages | < 100ms | 11-15ms | ✅ Excellent |
| Thread pages | < 150ms | N/A | ⏳ TBD |
| Search | < 200ms | 6-8ms | ✅ Excellent |
| Static assets | < 50ms | 1-3ms | ✅ Excellent |

### Current Performance Metrics

**From live performance stats:**
- **Average Response Time:** 18.25ms
- **Median (P50):** 17.18ms
- **P95:** 43.86ms
- **P99:** 46.75ms
- **Slow Requests:** 0
- **Success Rate:** 100%

**Analysis:**
- ✅ All metrics far exceed targets
- ✅ 95% of requests complete in < 44ms
- ✅ 99% of requests complete in < 47ms
- ✅ Zero slow requests (>1000ms)

## Testing Procedures

### 1. Baseline Performance Test

**Purpose:** Verify basic performance with minimal data

**Steps:**
```bash
# 1. Ensure app is running
docker-compose ps

# 2. Run performance test
./tests/performance/performance-test.sh

# 3. Expected result
Performance Score: 70-80% (Good)
```

### 2. Load Test with Large Dataset

**Purpose:** Test performance under realistic load

**Steps:**
```bash
# 1. Seed large dataset
docker-compose exec app node tests/performance/seed-large-dataset.js

# 2. Wait for seeding to complete
# Output: "✅ Seeding completed successfully!"

# 3. Run performance test
./tests/performance/performance-test.sh

# 4. Expected result
Performance Score: 70-80% (Good)
# Should be similar to baseline
```

### 3. Concurrent Load Test

**Purpose:** Test performance under concurrent load

**Using Apache Bench (ab):**
```bash
# Install ab (if not installed)
# macOS: brew install httpd
# Ubuntu: apt-get install apache2-utils

# Run 100 requests with 10 concurrent
ab -n 100 -c 10 http://localhost:3000/

# Expected results:
# - Requests per second: > 50
# - Time per request: < 200ms
# - Failed requests: 0
```

**Using wrk:**
```bash
# Install wrk
# macOS: brew install wrk
# Ubuntu: git clone https://github.com/wg/wrk && cd wrk && make

# Run 4 threads, 100 connections for 30 seconds
wrk -t4 -c100 -d30s http://localhost:3000/

# Expected results:
# - Requests/sec: > 100
# - Latency avg: < 100ms
# - Non-2xx responses: 0
```

### 4. Stress Test

**Purpose:** Find breaking point

**Steps:**
```bash
# Gradually increase load
ab -n 1000 -c 10 http://localhost:3000/   # Warm up
ab -n 1000 -c 50 http://localhost:3000/   # Light load
ab -n 1000 -c 100 http://localhost:3000/  # Medium load
ab -n 1000 -c 200 http://localhost:3000/  # Heavy load

# Monitor with performance stats
watch -n 1 'curl -s http://localhost:3000/performance-stats | jq ".averageResponseTime, .slowRequests"'
```

### 5. Database Performance Test

**Purpose:** Verify query performance

**Steps:**
```bash
# 1. Enable PostgreSQL query logging
# In docker-compose.yml:
# POSTGRES_LOG_STATEMENT: 'all'

# 2. Seed large dataset
docker-compose exec app node tests/performance/seed-large-dataset.js

# 3. Access pages and monitor logs
docker-compose logs -f db | grep "duration:"

# 4. Look for slow queries (> 100ms)
docker-compose logs db | grep "duration:" | awk '{if ($NF > 100) print}'

# Expected: Most queries < 50ms
```

## Performance Optimization

### Compression

**Gzip Compression** is enabled for:
- HTML pages
- CSS files
- JavaScript files
- JSON responses

**Configuration:**
```javascript
{
  level: 6,              // Compression level (0-9)
  threshold: 1024,       // Only compress if > 1KB
  filter: custom         // Selective compression
}
```

**Benefits:**
- ~70% reduction in HTML size
- ~75% reduction in CSS size
- ~70% reduction in JavaScript size
- Faster page loads
- Lower bandwidth costs

**Test Compression:**
```bash
# Test homepage compression
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/

# Look for: Content-Encoding: gzip
```

### Database Optimization

**Indexes Present:**
- Threads: category_id, user_id, updated_at, is_pinned
- Posts: thread_id, user_id, created_at, composite(thread_id, created_at)
- Users: email (unique), created_at
- Categories: display_order, name

**Query Optimization:**
- ✅ Eager loading with `include`
- ✅ Limited attribute selection
- ✅ Aggregate functions (COUNT)
- ✅ Proper ORDER BY with indexes
- ✅ LIMIT/OFFSET pagination
- ✅ No N+1 query problems

**Verify:**
```sql
-- In PostgreSQL, check query plan
EXPLAIN ANALYZE SELECT * FROM threads WHERE category_id = 1 LIMIT 20;

-- Expected: Index Scan (not Seq Scan)
```

### Caching

**Current Caching:**
- Homepage: 5 minutes
- Static assets: 7 days
- Browser caching headers

**Cache-Control Headers:**
```
HTML: public, max-age=0
CSS/JS: public, max-age=604800, immutable (7 days)
Images: public, max-age=2592000, immutable (30 days)
Fonts: public, max-age=31536000, immutable (1 year)
```

### Response Time Headers

Every response includes:
```
X-Response-Time: 23.45ms
```

**Usage:**
```bash
# Check response time
curl -I http://localhost:3000/ | grep X-Response-Time
```

## Troubleshooting

### Slow Performance

**Symptoms:**
- Pages loading > 2 seconds
- Performance score < 60%
- Slow request alerts

**Diagnosis:**
```bash
# 1. Check performance stats
curl http://localhost:3000/performance-stats | jq

# 2. Look for slow paths
curl -s http://localhost:3000/performance-stats | jq '.pathStats | to_entries | sort_by(.value.avgTime) | reverse | .[:5]'

# 3. Check database
docker-compose logs db | grep "duration:" | tail -20

# 4. Check system resources
docker stats educard_app educard_db
```

**Common Causes:**
1. Database connection issues
2. Large dataset without indexes
3. N+1 query problems
4. Memory leaks
5. Network issues

### High Response Times

**Check System Resources:**
```bash
# CPU and memory usage
docker stats --no-stream

# Database connections
docker-compose exec db psql -U postgres -d educard -c "SELECT count(*) FROM pg_stat_activity;"

# Application logs
docker-compose logs --tail=100 app
```

**Optimize:**
```bash
# Restart app to clear in-memory metrics
docker-compose restart app

# Vacuum database (if needed)
docker-compose exec db psql -U postgres -d educard -c "VACUUM ANALYZE;"

# Clear old data (if needed)
docker-compose exec app node -e "require('./src/middlewares/performanceMonitor').clearMetrics()"
```

### Failed Performance Tests

**404 Errors:**
- Ensure categories exist (run seeders)
- Check route configuration
- Verify database data

**Slow Requests:**
- Check database indexes
- Review query complexity
- Monitor system resources
- Consider caching

## Monitoring in Production

### Set Up External Monitoring

**Recommended Services:**
1. **New Relic** - Full APM
2. **Datadog** - Infrastructure + APM
3. **Application Insights** - Microsoft Azure
4. **Prometheus + Grafana** - Open source

**Key Metrics to Monitor:**
- Average response time
- P95/P99 response times
- Error rate
- Requests per second
- Database query times
- CPU usage
- Memory usage

### Configure Alerts

**Alert Thresholds:**
```javascript
{
  averageResponseTime: {
    warning: 100,  // ms
    critical: 500  // ms
  },
  p95ResponseTime: {
    warning: 500,   // ms
    critical: 1000  // ms
  },
  errorRate: {
    warning: 1,    // %
    critical: 5    // %
  },
  slowRequests: {
    warning: 5,     // per minute
    critical: 20    // per minute
  }
}
```

### Log Aggregation

**Recommended:**
- CloudWatch Logs (AWS)
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Papertrail

**Log Format:**
```json
{
  "timestamp": "2025-12-09T14:30:45.123Z",
  "level": "info",
  "method": "GET",
  "url": "/category/general",
  "statusCode": 200,
  "responseTime": 23.45,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

## Performance Tips

### For Developers

1. **Always test with large dataset**
   ```bash
   node tests/performance/seed-large-dataset.js
   ```

2. **Monitor slow queries**
   ```bash
   docker-compose logs db | grep "duration:"
   ```

3. **Use eager loading**
   ```javascript
   // Bad (N+1 problem)
   const threads = await Thread.findAll();
   for (let thread of threads) {
     thread.author = await User.findByPk(thread.userId);
   }
   
   // Good (eager loading)
   const threads = await Thread.findAll({
     include: [{ model: User, as: 'author' }]
   });
   ```

4. **Limit attributes**
   ```javascript
   // Only select needed fields
   attributes: ['id', 'username', 'displayName']
   ```

5. **Add indexes for frequent queries**
   ```javascript
   indexes: [
     { fields: ['foreign_key_column'] },
     { fields: ['frequently_queried_column'] }
   ]
   ```

### For Deployment

1. **Enable compression** ✅ (Already enabled)
2. **Configure caching** ✅ (Already configured)
3. **Set up monitoring** ⚠️ (To be configured)
4. **Optimize images** ⚠️ (Future enhancement)
5. **Use CDN for static assets** ⚠️ (Future enhancement)
6. **Enable HTTP/2** ⚠️ (Future enhancement)

## Additional Resources

- [Performance Documentation](../../docs/k8s-tasks/TASK-6.4-SUMMARY.md)
- [Database Optimization Guide](https://sequelize.org/docs/v6/core-concepts/optimistic-locking/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Last Updated:** December 9, 2025  
**Performance Score:** 73% (Good)  
**Average Response Time:** 18.25ms (Excellent)  
**Next Performance Review:** +1 month
