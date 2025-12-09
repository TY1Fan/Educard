import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const pageLoadTime = new Trend('page_load_time');

// Test configuration - Light load: 25 concurrent users for 5 minutes
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 25 },  // Ramp up to 25 users
    { duration: '5m', target: 25 },  // Stay at 25 users for 5 minutes
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete below 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
    errors: ['rate<0.01'],             // Error rate should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate different user behaviors
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Homepage visitor
    browseHomepage();
  } else if (scenario < 0.7) {
    // 30% - Thread browser
    browseThreads();
  } else if (scenario < 0.9) {
    // 20% - Read specific thread
    readThread();
  } else {
    // 10% - Search
    searchContent();
  }
  
  // Think time - simulate user reading/thinking
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

function browseHomepage() {
  const response = http.get(BASE_URL);
  
  const success = check(response, {
    'homepage loaded': (r) => r.status === 200,
    'homepage has content': (r) => r.body.includes('Educard'),
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function browseThreads() {
  // Get threads list
  const threadsResponse = http.get(`${BASE_URL}/threads`);
  
  const success = check(threadsResponse, {
    'threads page loaded': (r) => r.status === 200,
  });
  
  pageLoadTime.add(threadsResponse.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(1);
}

function readThread() {
  // Read a specific thread (assuming threads with IDs 1-10 exist)
  const threadId = Math.floor(Math.random() * 10) + 1;
  const threadResponse = http.get(`${BASE_URL}/threads/${threadId}`);
  
  const success = check(threadResponse, {
    'thread loaded': (r) => r.status === 200 || r.status === 404,
  });
  
  pageLoadTime.add(threadResponse.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(2); // Simulate reading time
}

function searchContent() {
  const searchTerms = ['javascript', 'python', 'web', 'test', 'help'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const searchResponse = http.get(`${BASE_URL}/search?q=${term}`);
  
  const success = check(searchResponse, {
    'search completed': (r) => r.status === 200,
  });
  
  pageLoadTime.add(searchResponse.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('Light Load Test Results (25 Concurrent Users)');
  console.log('='.repeat(60));
  
  const httpReqDuration = data.metrics.http_req_duration;
  if (httpReqDuration) {
    console.log('\nResponse Times:');
    console.log(`  Average: ${httpReqDuration.values.avg.toFixed(2)}ms`);
    console.log(`  Median:  ${httpReqDuration.values.med.toFixed(2)}ms`);
    console.log(`  P(90):   ${httpReqDuration.values['p(90)'].toFixed(2)}ms`);
    console.log(`  P(95):   ${httpReqDuration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  P(99):   ${httpReqDuration.values['p(99)'].toFixed(2)}ms`);
  }
  
  const httpReqs = data.metrics.http_reqs;
  if (httpReqs) {
    console.log(`\nTotal Requests: ${httpReqs.values.count}`);
    console.log(`Request Rate:   ${httpReqs.values.rate.toFixed(2)}/s`);
  }
  
  const errors = data.metrics.errors;
  if (errors) {
    const errorPercentage = (errors.values.rate * 100).toFixed(2);
    console.log(`\nError Rate: ${errorPercentage}%`);
  }
  
  const httpReqFailed = data.metrics.http_req_failed;
  if (httpReqFailed) {
    const failurePercentage = (httpReqFailed.values.rate * 100).toFixed(2);
    console.log(`HTTP Failures: ${failurePercentage}%`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Determine if test passed
  const avgResponseTime = httpReqDuration?.values.avg || 0;
  const p95ResponseTime = httpReqDuration?.values['p(95)'] || 0;
  const errorRateValue = errors?.values.rate || 0;
  
  if (p95ResponseTime < 2000 && errorRateValue < 0.01) {
    console.log('✓ Test PASSED - All thresholds met');
  } else {
    console.log('✗ Test FAILED - Some thresholds not met');
    if (p95ResponseTime >= 2000) {
      console.log(`  - P(95) response time: ${p95ResponseTime.toFixed(2)}ms (threshold: <2000ms)`);
    }
    if (errorRateValue >= 0.01) {
      console.log(`  - Error rate: ${(errorRateValue * 100).toFixed(2)}% (threshold: <1%)`);
    }
  }
  console.log('='.repeat(60) + '\n');
  
  return {
    'stdout': '',
  };
}
