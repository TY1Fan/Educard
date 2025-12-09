import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const pageLoadTime = new Trend('page_load_time');

// Test configuration - Normal load: 100 concurrent users for 10 minutes
export const options = {
  stages: [
    { duration: '2m', target: 30 },   // Ramp up to 30 users
    { duration: '3m', target: 70 },   // Ramp up to 70 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users for 10 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete below 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
    errors: ['rate<0.01'],             // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate realistic user behavior patterns
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - New visitor browsing homepage
    browseHomepage();
  } else if (scenario < 0.5) {
    // 20% - Browse threads
    browseThreads();
  } else if (scenario < 0.75) {
    // 25% - Read threads
    readMultipleThreads();
  } else if (scenario < 0.85) {
    // 10% - Search
    performSearch();
  } else if (scenario < 0.95) {
    // 10% - View user profiles
    viewUserProfile();
  } else {
    // 5% - Check health/static resources
    checkHealth();
  }
  
  // Realistic think time
  sleep(Math.random() * 4 + 1); // 1-5 seconds
}

function browseHomepage() {
  const response = http.get(BASE_URL);
  
  const success = check(response, {
    'homepage loaded': (r) => r.status === 200,
    'homepage has title': (r) => r.body.includes('Educard'),
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function browseThreads() {
  const response = http.get(`${BASE_URL}/threads`);
  
  const success = check(response, {
    'threads page loaded': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(1);
  
  // Load pagination
  if (Math.random() > 0.5) {
    const page = Math.floor(Math.random() * 3) + 2;
    const paginatedResponse = http.get(`${BASE_URL}/threads?page=${page}`);
    
    const pageSuccess = check(paginatedResponse, {
      'paginated threads loaded': (r) => r.status === 200,
    });
    
    pageLoadTime.add(paginatedResponse.timings.duration);
    errorRate.add(!pageSuccess);
    if (pageSuccess) successfulRequests.add(1);
  }
}

function readMultipleThreads() {
  // Read 2-4 threads
  const threadCount = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < threadCount; i++) {
    const threadId = Math.floor(Math.random() * 20) + 1;
    const response = http.get(`${BASE_URL}/threads/${threadId}`);
    
    const success = check(response, {
      'thread loaded': (r) => r.status === 200 || r.status === 404,
    });
    
    pageLoadTime.add(response.timings.duration);
    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    
    // Simulate reading
    sleep(Math.random() * 3 + 2); // 2-5 seconds per thread
  }
}

function performSearch() {
  const searchTerms = [
    'javascript', 'python', 'web development', 'tutorial',
    'help', 'question', 'how to', 'best practices',
    'performance', 'database', 'api', 'testing'
  ];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(`${BASE_URL}/search?q=${encodeURIComponent(term)}`);
  
  const success = check(response, {
    'search completed': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(1);
  
  // Click on search result
  if (success && Math.random() > 0.5) {
    const threadId = Math.floor(Math.random() * 20) + 1;
    const threadResponse = http.get(`${BASE_URL}/threads/${threadId}`);
    
    const threadSuccess = check(threadResponse, {
      'thread from search loaded': (r) => r.status === 200 || r.status === 404,
    });
    
    pageLoadTime.add(threadResponse.timings.duration);
    errorRate.add(!threadSuccess);
    if (threadSuccess) successfulRequests.add(1);
  }
}

function viewUserProfile() {
  const userId = Math.floor(Math.random() * 10) + 1;
  const response = http.get(`${BASE_URL}/users/${userId}`);
  
  const success = check(response, {
    'user profile loaded': (r) => r.status === 200 || r.status === 404,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function checkHealth() {
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health check passed': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('Normal Load Test Results (100 Concurrent Users)');
  console.log('='.repeat(60));
  
  const httpReqDuration = data.metrics.http_req_duration;
  if (httpReqDuration) {
    console.log('\nResponse Times:');
    console.log(`  Average: ${httpReqDuration.values.avg.toFixed(2)}ms`);
    console.log(`  Median:  ${httpReqDuration.values.med.toFixed(2)}ms`);
    console.log(`  Min:     ${httpReqDuration.values.min.toFixed(2)}ms`);
    console.log(`  Max:     ${httpReqDuration.values.max.toFixed(2)}ms`);
    console.log(`  P(90):   ${httpReqDuration.values['p(90)'].toFixed(2)}ms`);
    console.log(`  P(95):   ${httpReqDuration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  P(99):   ${httpReqDuration.values['p(99)'].toFixed(2)}ms`);
  }
  
  const httpReqs = data.metrics.http_reqs;
  if (httpReqs) {
    console.log(`\nTotal Requests: ${httpReqs.values.count}`);
    console.log(`Request Rate:   ${httpReqs.values.rate.toFixed(2)}/s`);
    const duration = data.state.testRunDurationMs / 1000;
    console.log(`Test Duration:  ${duration.toFixed(0)}s`);
  }
  
  const errors = data.metrics.errors;
  if (errors) {
    const errorPercentage = (errors.values.rate * 100).toFixed(2);
    console.log(`\nError Rate: ${errorPercentage}%`);
  }
  
  const httpReqFailed = data.metrics.http_req_failed;
  if (httpReqFailed) {
    const failurePercentage = (httpReqFailed.values.rate * 100).toFixed(2);
    const failureCount = httpReqs ? Math.round(httpReqs.values.count * httpReqFailed.values.rate) : 0;
    console.log(`HTTP Failures: ${failurePercentage}% (${failureCount} requests)`);
  }
  
  const dataReceived = data.metrics.data_received;
  if (dataReceived) {
    const mbReceived = (dataReceived.values.count / 1024 / 1024).toFixed(2);
    const mbPerSec = (dataReceived.values.rate / 1024 / 1024).toFixed(2);
    console.log(`\nData Received: ${mbReceived} MB (${mbPerSec} MB/s)`);
  }
  
  const vus = data.metrics.vus;
  if (vus) {
    console.log(`\nVirtual Users:`)
    console.log(`  Max: ${vus.values.max}`);
    console.log(`  Avg: ${vus.values.value.toFixed(0)}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Determine if test passed
  const p95ResponseTime = httpReqDuration?.values['p(95)'] || 0;
  const errorRateValue = errors?.values.rate || 0;
  const failureRate = httpReqFailed?.values.rate || 0;
  
  let testPassed = true;
  const issues = [];
  
  if (p95ResponseTime >= 2000) {
    testPassed = false;
    issues.push(`P(95) response time: ${p95ResponseTime.toFixed(2)}ms (target: <2000ms)`);
  }
  
  if (errorRateValue >= 0.01) {
    testPassed = false;
    issues.push(`Error rate: ${(errorRateValue * 100).toFixed(2)}% (target: <1%)`);
  }
  
  if (failureRate >= 0.01) {
    testPassed = false;
    issues.push(`HTTP failure rate: ${(failureRate * 100).toFixed(2)}% (target: <1%)`);
  }
  
  if (testPassed) {
    console.log('✓ Test PASSED - All thresholds met');
    console.log('  System handles 100 concurrent users successfully');
  } else {
    console.log('✗ Test FAILED - Some thresholds not met:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('='.repeat(60) + '\n');
  
  return {
    'stdout': '',
  };
}
