import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const pageLoadTime = new Trend('page_load_time');

// Test configuration - Stress test: Find breaking point
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up to normal load
    { duration: '3m', target: 200 },   // Increase to 200
    { duration: '3m', target: 300 },   // Increase to 300
    { duration: '3m', target: 400 },   // Increase to 400
    { duration: '3m', target: 500 },   // Increase to 500
    { duration: '3m', target: 600 },   // Increase to 600 (pushing limits)
    { duration: '5m', target: 600 },   // Stay at 600 to see stability
    { duration: '3m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // No hard thresholds - we expect this to fail at some point
    // We're measuring where it breaks
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Aggressive user behavior during stress test
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Homepage
    http.get(BASE_URL);
  } else if (scenario < 0.5) {
    // 20% - Threads list
    http.get(`${BASE_URL}/threads`);
  } else if (scenario < 0.75) {
    // 25% - Read thread
    const threadId = Math.floor(Math.random() * 40) + 1;
    http.get(`${BASE_URL}/threads/${threadId}`);
  } else if (scenario < 0.9) {
    // 15% - Search
    const term = ['test', 'help', 'question'][Math.floor(Math.random() * 3)];
    http.get(`${BASE_URL}/search?q=${term}`);
  } else {
    // 10% - User profiles
    const userId = Math.floor(Math.random() * 20) + 1;
    http.get(`${BASE_URL}/users/${userId}`);
  }
  
  // Minimal sleep - aggressive load
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

export function handleSummary(data) {
  console.log('\n' + '='.repeat(60));
  console.log('Stress Test Results - Finding Breaking Point');
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
  }
  
  const httpReqFailed = data.metrics.http_req_failed;
  if (httpReqFailed) {
    const failurePercentage = (httpReqFailed.values.rate * 100).toFixed(2);
    const failureCount = httpReqs ? Math.round(httpReqs.values.count * httpReqFailed.values.rate) : 0;
    console.log(`\nHTTP Failures: ${failurePercentage}% (${failureCount} requests)`);
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
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Breaking Point Analysis:');
  console.log('='.repeat(60));
  
  const p95ResponseTime = httpReqDuration?.values['p(95)'] || 0;
  const p99ResponseTime = httpReqDuration?.values['p(99)'] || 0;
  const avgResponseTime = httpReqDuration?.values.avg || 0;
  const failureRate = httpReqFailed?.values.rate || 0;
  
  console.log('\nSystem Behavior Under Stress:');
  
  if (failureRate > 0.1) {
    console.log(`  ✗ High failure rate: ${(failureRate * 100).toFixed(2)}%`);
    console.log('  → System is beyond capacity at peak load');
  } else if (failureRate > 0.05) {
    console.log(`  ⚠ Moderate failure rate: ${(failureRate * 100).toFixed(2)}%`);
    console.log('  → System is approaching limits');
  } else {
    console.log(`  ✓ Acceptable failure rate: ${(failureRate * 100).toFixed(2)}%`);
  }
  
  if (p95ResponseTime > 5000) {
    console.log(`  ✗ Very slow P(95): ${p95ResponseTime.toFixed(2)}ms`);
    console.log('  → Severe performance degradation');
  } else if (p95ResponseTime > 3000) {
    console.log(`  ⚠ Slow P(95): ${p95ResponseTime.toFixed(2)}ms`);
    console.log('  → Performance degradation under stress');
  } else {
    console.log(`  ✓ Good P(95): ${p95ResponseTime.toFixed(2)}ms`);
  }
  
  if (p99ResponseTime > 10000) {
    console.log(`  ✗ Very slow P(99): ${p99ResponseTime.toFixed(2)}ms`);
    console.log('  → Some requests timing out');
  } else if (p99ResponseTime > 5000) {
    console.log(`  ⚠ Slow P(99): ${p99ResponseTime.toFixed(2)}ms`);
  } else {
    console.log(`  ✓ Good P(99): ${p99ResponseTime.toFixed(2)}ms`);
  }
  
  console.log('\nRecommendations:');
  
  if (failureRate < 0.01 && p95ResponseTime < 2000) {
    console.log('  ✓ System handles stress well!');
    console.log('  → Max concurrent users: 600+');
    console.log('  → Consider testing even higher loads');
  } else if (failureRate < 0.05 && p95ResponseTime < 3000) {
    console.log('  ⚠ System can handle moderate stress');
    console.log('  → Max recommended users: 400-500');
    console.log('  → Consider optimizations for higher capacity');
  } else {
    console.log('  ✗ System struggles under stress');
    console.log('  → Max recommended users: 200-300');
    console.log('  → Performance optimization needed');
    console.log('  → Consider:');
    console.log('    - Database query optimization');
    console.log('    - Caching strategies');
    console.log('    - Connection pooling');
    console.log('    - Load balancing');
  }
  
  console.log('='.repeat(60) + '\n');
  
  return {
    'stdout': '',
  };
}
