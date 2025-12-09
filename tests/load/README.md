# Load Testing Suite

Comprehensive load testing for the Educard Forum application using k6.

## Overview

This test suite validates application performance under various load conditions to ensure the system can handle expected traffic and identify bottlenecks.

## Prerequisites

- **k6 installed**: `brew install k6`
- **Application running**: Server must be accessible at `http://localhost:3000`
- **Docker containers running**: `docker ps` should show `educard_app` and `educard_db`

## Test Scenarios

### 1. Baseline Test (`baseline.js`)
- **Duration**: < 1 minute
- **Load**: 1 user, 10 iterations
- **Purpose**: Establish baseline performance metrics without load
- **Threshold**: P(95) < 500ms

**Run:**
```bash
k6 run tests/load/baseline.js
```

### 2. Light Load Test (`light-load.js`)
- **Duration**: ~9 minutes
- **Load**: Ramps up to 25 concurrent users
- **Purpose**: Validate performance under light traffic
- **Thresholds**:
  - P(95) response time < 2000ms
  - Error rate < 1%
  - HTTP failure rate < 1%

**Run:**
```bash
k6 run tests/load/light-load.js
```

### 3. Normal Load Test (`normal-load.js`)
- **Duration**: ~19 minutes
- **Load**: Ramps up to 100 concurrent users
- **Purpose**: Validate performance under expected normal traffic
- **Thresholds**:
  - P(95) response time < 2000ms
  - Error rate < 1%
  - HTTP failure rate < 1%

**Run:**
```bash
k6 run tests/load/normal-load.js
```

### 4. Peak Load Test (`peak-load.js`)
- **Duration**: ~21 minutes
- **Load**: Ramps up to 300 concurrent users
- **Purpose**: Validate performance during peak traffic periods
- **Thresholds**:
  - P(95) response time < 3000ms
  - Error rate < 5%
  - HTTP failure rate < 5%

**Run:**
```bash
k6 run tests/load/peak-load.js
```

### 5. Stress Test (`stress-test.js`)
- **Duration**: ~25 minutes
- **Load**: Ramps up to 600 concurrent users
- **Purpose**: Find the breaking point of the system
- **Thresholds**: None (intentionally pushing system to failure)

**Run:**
```bash
k6 run tests/load/stress-test.js
```

### 6. Soak Test (`soak-test.js`)
- **Duration**: ~70 minutes (1 hour)
- **Load**: Sustained 50 concurrent users
- **Purpose**: Detect memory leaks and stability issues over extended period
- **Thresholds**:
  - P(95) response time < 2000ms
  - Error rate < 1%
  - No performance degradation over time

**Run:**
```bash
k6 run tests/load/soak-test.js
```

## Running Tests

### Interactive Test Runner

Use the interactive script to select and run tests:

```bash
cd tests/load
./run-tests.sh
```

This will present a menu:
1. Baseline Test (quick)
2. Light Load Test (25 users, ~9 min)
3. Normal Load Test (100 users, ~19 min)
4. Peak Load Test (300 users, ~21 min)
5. Stress Test (up to 600 users, ~25 min)
6. Soak Test (50 users, ~70 min)
7. Run All Tests (~2.5 hours)
8. Quick Suite (Baseline + Light + Normal, ~30 min)

### Individual Test Runs

Run specific tests directly:

```bash
# Baseline
k6 run tests/load/baseline.js

# Light Load
k6 run tests/load/light-load.js

# Normal Load
k6 run tests/load/normal-load.js

# Peak Load
k6 run tests/load/peak-load.js

# Stress Test
k6 run tests/load/stress-test.js

# Soak Test
k6 run tests/load/soak-test.js
```

### Custom Base URL

Override the default URL:

```bash
BASE_URL=http://yourdomain.com k6 run tests/load/normal-load.js
```

## Monitoring During Tests

### Real-time System Stats

Monitor Docker container resources:

```bash
docker stats educard_app educard_db
```

Output shows:
- CPU usage
- Memory usage
- Network I/O
- Block I/O

### Application Logs

Monitor application logs in real-time:

```bash
docker logs educard_app -f
```

### Database Connections

Check active database connections:

```bash
docker exec -it educard_db psql -U postgres -d educard_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname='educard_db';"
```

### Performance Monitoring Endpoint

Access built-in performance stats:

```bash
curl http://localhost:3000/performance-stats | jq
```

## Understanding Results

### Key Metrics

**Response Time Percentiles:**
- **P(50) / Median**: Half of requests complete faster than this
- **P(90)**: 90% of requests complete faster than this
- **P(95)**: 95% of requests complete faster than this (key SLA metric)
- **P(99)**: 99% of requests complete faster than this

**Request Rate:**
- Requests per second the system handles
- Higher is better

**Error Rate:**
- Percentage of failed requests
- Should be < 1% under normal load
- Should be < 5% under peak load

**Throughput:**
- Data transferred per second
- Indicates network capacity

### Success Criteria

**Light Load (25 users):**
- ✓ P(95) < 2000ms
- ✓ Error rate < 1%
- ✓ System stable

**Normal Load (100 users):**
- ✓ P(95) < 2000ms
- ✓ Error rate < 1%
- ✓ Request rate > 50 req/s

**Peak Load (300 users):**
- ✓ P(95) < 3000ms
- ✓ Error rate < 5%
- ✓ System handles load without crashes

**Stress Test:**
- ✓ Identify maximum capacity
- ✓ System degrades gracefully
- ✓ Recovery after load reduction

**Soak Test:**
- ✓ No performance degradation over time
- ✓ No memory leaks (stable memory usage)
- ✓ Error rate remains constant

## Test Scenarios Simulated

Each test simulates realistic user behavior:

### User Behaviors
- **40%** - Browse homepage
- **30%** - Browse threads list
- **20%** - Read specific threads
- **10%** - Search content
- **5%** - View user profiles

### Think Time
- **Light Load**: 2-5 seconds between actions
- **Normal Load**: 1-5 seconds
- **Peak Load**: 0.5-2.5 seconds
- **Stress Test**: 0.1-0.6 seconds (aggressive)
- **Soak Test**: 2-7 seconds (realistic)

## Troubleshooting

### Test Fails to Start

**Error**: Cannot connect to server
```bash
# Check if server is running
curl http://localhost:3000/health

# Check Docker containers
docker ps

# Restart containers if needed
docker-compose up -d
```

### High Error Rates

**Possible Causes**:
1. Database connection pool exhausted
2. Memory limits reached
3. CPU saturation
4. Network timeouts

**Actions**:
```bash
# Check container resources
docker stats educard_app

# Check database connections
docker exec -it educard_db psql -U postgres -d educard_db \
  -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check application logs
docker logs educard_app --tail 100
```

### Slow Response Times

**Possible Causes**:
1. Unoptimized database queries
2. Missing indexes
3. Insufficient caching
4. Resource constraints

**Actions**:
```bash
# Enable performance monitoring
curl http://localhost:3000/performance-stats

# Check slow queries in database
docker exec -it educard_db psql -U postgres -d educard_db \
  -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check indexes
docker exec -it educard_db psql -U postgres -d educard_db \
  -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"
```

### Memory Leaks (Soak Test)

**Symptoms**:
- Gradually increasing response times
- Memory usage grows over time
- Eventual crashes

**Actions**:
```bash
# Monitor memory during soak test
docker stats educard_app --no-stream --format "table {{.Name}}\t{{.MemUsage}}" > memory-usage.log

# Check for unclosed connections
docker logs educard_app | grep -i "connection\|pool"

# Generate heap snapshot (if Node.js)
docker exec educard_app kill -USR2 $(docker exec educard_app pgrep -f node)
```

## Performance Optimization Tips

### Database
- Add indexes on frequently queried columns
- Optimize N+1 query problems
- Use connection pooling
- Enable query caching

### Application
- Implement response caching
- Optimize static asset delivery
- Use compression middleware (gzip)
- Minimize synchronous operations

### Infrastructure
- Increase Docker container resources
- Use load balancing for horizontal scaling
- Implement CDN for static assets
- Consider Redis for session/cache storage

## Interpreting Results

### Good Performance
```
Response Times:
  Average: 150ms
  P(95): 800ms
  P(99): 1500ms

Error Rate: 0.1%
Request Rate: 120 req/s
```

### Acceptable Performance (Under Load)
```
Response Times:
  Average: 400ms
  P(95): 1800ms
  P(99): 2500ms

Error Rate: 0.5%
Request Rate: 80 req/s
```

### Poor Performance (Needs Optimization)
```
Response Times:
  Average: 1200ms
  P(95): 4000ms
  P(99): 8000ms

Error Rate: 3%
Request Rate: 30 req/s
```

## Next Steps After Testing

1. **Document Results**: Save test outputs and metrics
2. **Identify Bottlenecks**: Analyze slow endpoints
3. **Optimize**: Implement performance improvements
4. **Retest**: Validate optimizations
5. **Set Monitoring**: Implement ongoing performance monitoring
6. **Plan Capacity**: Determine infrastructure needs

## Files

- `baseline.js` - Baseline performance test
- `light-load.js` - Light load test (25 users)
- `normal-load.js` - Normal load test (100 users)
- `peak-load.js` - Peak load test (300 users)
- `stress-test.js` - Stress test (up to 600 users)
- `soak-test.js` - Soak test (1 hour duration)
- `run-tests.sh` - Interactive test runner
- `README.md` - This file

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Cloud](https://k6.io/cloud/) - For cloud-based load testing
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)

## Support

For issues or questions:
1. Check application logs: `docker logs educard_app`
2. Review k6 documentation: https://k6.io/docs/
3. Check Task 6.6 implementation details in `specs/40-tasks.md`
