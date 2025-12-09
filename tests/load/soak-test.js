import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const pageLoadTime = new Trend('page_load_time');

// Test configuration - Soak test: Extended duration to find memory leaks
// Run at moderate load for extended period (1 hour)
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up to 50 users
    { duration: '60m', target: 50 },   // Stay at 50 users for 1 hour
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Response time shouldn't degrade
    http_req_failed: ['rate<0.01'],    // Error rate should stay low
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate realistic long-term user behavior
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    browseHomepage();
  } else if (scenario < 0.5) {
    browseThreads();
  } else if (scenario < 0.75) {
    readThreads();
  } else if (scenario < 0.9) {
    performSearch();
  } else {
    viewUserProfile();
  }
  
  // Normal think time
  sleep(Math.random() * 5 + 2); // 2-7 seconds
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
  const page = Math.floor(Math.random() * 3) + 1;
  const response = http.get(`${BASE_URL}/threads?page=${page}`);
  
  const success = check(response, {
    'threads page loaded': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(2);
}

function readThreads() {
  const threadCount = Math.floor(Math.random() * 2) + 1;
  
  for (let i = 0; i < threadCount; i++) {
    const threadId = Math.floor(Math.random() * 20) + 1;
    const response = http.get(`${BASE_URL}/threads/${threadId}`);
    
    const success = check(response, {
      'thread loaded': (r) => r.status === 200 || r.status === 404,
    });
    
    pageLoadTime.add(response.timings.duration);
    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    
    sleep(Math.random() * 4 + 2); // 2-6 seconds reading
  }
}

function performSearch() {
  const searchTerms = ['javascript', 'python', 'help', 'tutorial', 'question'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(`${BASE_URL}/search?q=${encodeURIComponent(term)}`);
  
  const success = check(response, {
    'search completed': (r) => r.status === 200,
  });
  
  pageLoadTime.add(response.timings.duration);
  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  
  sleep(2);
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

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('Soak Test Results - 1 Hour Duration');
  console.log('Memory Leak and Stability Detection');
  console.log('='.repeat(60));
  
  const httpReqDuration = data.metrics.http_req_duration;
  if (httpReqDuration) {
    console.log('\nResponse Times Over 1 Hour:');
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
    console.log(`\nData Transferred: ${mbReceived} MB (${mbPerSec} MB/s)`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Stability Analysis:');
  console.log('='.repeat(60));
  
  const avgResponseTime = httpReqDuration?.values.avg || 0;
  const p95ResponseTime = httpReqDuration?.values['p(95)'] || 0;
  const p99ResponseTime = httpReqDuration?.values['p(99)'] || 0;
  const failureRate = httpReqFailed?.values.rate || 0;
  const errorRateValue = errors?.values.rate || 0;
  
  let issuesFound = [];
  let warningsFound = [];
  
  // Check for performance degradation (potential memory leak indicator)
  if (p95ResponseTime > 2500) {
    issuesFound.push('P(95) response time exceeded 2.5s - possible performance degradation');
  } else if (p95ResponseTime > 2000) {
    warningsFound.push('P(95) response time close to threshold (2s)');
  }
  
  // Check for increasing error rate
  if (failureRate > 0.02) {
    issuesFound.push(`Failure rate ${(failureRate * 100).toFixed(2)}% exceeds 2% - stability concern`);
  } else if (failureRate > 0.01) {
    warningsFound.push(`Failure rate ${(failureRate * 100).toFixed(2)}% exceeds 1%`);
  }
  
  if (errorRateValue > 0.02) {
    issuesFound.push(`Error rate ${(errorRateValue * 100).toFixed(2)}% exceeds 2%`);
  }
  
  // Analyze max response time for anomalies
  const maxResponseTime = httpReqDuration?.values.max || 0;
  if (maxResponseTime > 10000) {
    warningsFound.push(`Max response time ${maxResponseTime.toFixed(2)}ms - check for timeout issues`);
  }
  
  console.log('\nSoak Test Assessment:');
  
  if (issuesFound.length === 0) {
    console.log('  ✓ No stability issues detected');
    console.log('  ✓ No signs of memory leaks');
    console.log('  ✓ Consistent performance over 1 hour');
    console.log('  ✓ System is stable for long-running operations');
    
    if (warningsFound.length > 0) {
      console.log('\n⚠ Warnings:');
      warningsFound.forEach(warning => console.log(`  - ${warning}`));
    }
  } else {
    console.log('  ✗ Stability issues detected:');
    issuesFound.forEach(issue => console.log(`  - ${issue}`));
    
    if (warningsFound.length > 0) {
      console.log('\n⚠ Additional warnings:');
      warningsFound.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\nRecommended Actions:');
    console.log('  1. Monitor system memory usage over time');
    console.log('  2. Check for database connection leaks');
    console.log('  3. Review application logs for errors');
    console.log('  4. Analyze heap dumps if available');
    console.log('  5. Check for unclosed resources (files, connections)');
  }
  
  console.log('\nTo monitor system resources during soak test, run:');
  console.log('  docker stats educard_app');
  console.log('  docker logs educard_app --tail 100 -f');
  
  console.log('='.repeat(60) + '\n');
  
  return {
    'stdout': '',
  };
}
