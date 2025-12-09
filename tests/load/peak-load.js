import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const pageLoadTime = new Trend('page_load_time');

// Test configuration - Peak load: 300 concurrent users
export const options = {
  stages: [
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 200 },  // Ramp up to 200 users
    { duration: '2m', target: 300 },  // Ramp up to 300 users (peak)
    { duration: '10m', target: 300 }, // Stay at peak for 10 minutes
    { duration: '3m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should complete below 3s
    http_req_failed: ['rate<0.05'],    // Less than 5% of requests should fail
    errors: ['rate<0.05'],             // Error rate should be less than 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate realistic user behavior during peak traffic
  const scenario = Math.random();
  
  if (scenario < 0.25) {
    // 25% - Homepage traffic
    browseHomepage();
  } else if (scenario < 0.45) {
    // 20% - Browse threads list
    browseThreads();
  } else if (scenario < 0.7) {
    // 25% - Read specific threads
    readThreads();
  } else if (scenario < 0.85) {
    // 15% - Search functionality
    performSearch();
  } else if (scenario < 0.95) {
    // 10% - User profiles
    viewUserProfile();
  } else {
    // 5% - Static resources
    loadStaticResources();
  }
  
  // Shorter think time during peak hours (users are more active)
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

function browseHomepage() {
  const response = http.get(BASE_URL);
  
  const success = check(response, {
    'homepage loaded': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function browseThreads() {
  const page = Math.floor(Math.random() * 5) + 1;
  const response = http.get(`${BASE_URL}/threads?page=${page}`);
  
  const success = check(response, {
    'threads page loaded': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function readThreads() {
  // Quick browsing - read 1-2 threads
  const threadCount = Math.floor(Math.random() * 2) + 1;
  
  for (let i = 0; i < threadCount; i++) {
    const threadId = Math.floor(Math.random() * 30) + 1;
    const response = http.get(`${BASE_URL}/threads/${threadId}`);
    
    const success = check(response, {
      'thread loaded': (r) => r.status === 200 || r.status === 404,
    });
    
    pageLoadTime.add(response.timings.duration);
    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    
    // Quick reading during peak
    sleep(Math.random() * 2 + 1); // 1-3 seconds
  }
}

function performSearch() {
  const searchTerms = [
    'javascript', 'python', 'help', 'tutorial', 'question',
    'how to', 'best', 'beginner', 'advanced', 'tips'
  ];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(`${BASE_URL}/search?q=${encodeURIComponent(term)}`);
  
  const success = check(response, {
    'search completed': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function viewUserProfile() {
  const userId = Math.floor(Math.random() * 15) + 1;
  const response = http.get(`${BASE_URL}/users/${userId}`);
  
  const success = check(response, {
    'user profile loaded': (r) => r.status === 200 || r.status === 404,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

function loadStaticResources() {
  // Simulate loading CSS, JS, and images
  const resources = [
    '/health',
    '/sitemap.xml',
  ];
  
  const resource = resources[Math.floor(Math.random() * resources.length)];
  const response = http.get(`${BASE_URL}${resource}`);
  
  const success = check(response, {
    'resource loaded': (r) => r.status === 200 || r.status === 404,
  });
  
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
}

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('Peak Load Test Results (300 Concurrent Users)');
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
    const duration = data.state.testRunDurationMs / 1000 / 60;
    console.log(`Test Duration:  ${duration.toFixed(1)} minutes`);
  }
  
  const errors = data.metrics.errors;
  if (errors) {
    const errorPercentage = (errors.values.rate * 100).toFixed(2);
    const errorCount = httpReqs ? Math.round(httpReqs.values.count * errors.values.rate) : 0;
    console.log(`\nError Rate: ${errorPercentage}% (${errorCount} errors)`);
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
  const warnings = [];
  
  if (p95ResponseTime >= 3000) {
    testPassed = false;
    issues.push(`P(95) response time: ${p95ResponseTime.toFixed(2)}ms (target: <3000ms)`);
  } else if (p95ResponseTime >= 2500) {
    warnings.push(`P(95) response time: ${p95ResponseTime.toFixed(2)}ms (close to limit)`);
  }
  
  if (errorRateValue >= 0.05) {
    testPassed = false;
    issues.push(`Error rate: ${(errorRateValue * 100).toFixed(2)}% (target: <5%)`);
  }
  
  if (failureRate >= 0.05) {
    testPassed = false;
    issues.push(`HTTP failure rate: ${(failureRate * 100).toFixed(2)}% (target: <5%)`);
  }
  
  if (testPassed) {
    console.log('✓ Test PASSED - System handles peak load (300 users)');
    if (warnings.length > 0) {
      console.log('\n⚠ Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  } else {
    console.log('✗ Test FAILED - System cannot handle peak load:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('='.repeat(60) + '\n');
  
  return {
    'stdout': '',
  };
}
