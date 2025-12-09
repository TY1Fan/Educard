import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration - single request to establish baseline
export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete below 500ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  const homeResponse = http.get(BASE_URL);
  
  const homeCheck = check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!homeCheck);
  
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!healthCheck);
  
  // Small sleep between requests
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Baseline Performance Test Results\n`;
  summary += `${indent}${'='.repeat(50)}\n\n`;
  
  // HTTP request duration
  const httpReqDuration = data.metrics.http_req_duration;
  if (httpReqDuration && httpReqDuration.values) {
    summary += `${indent}Response Times:\n`;
    summary += `${indent}  Average: ${(httpReqDuration.values.avg || 0).toFixed(2)}ms\n`;
    summary += `${indent}  Median:  ${(httpReqDuration.values.med || 0).toFixed(2)}ms\n`;
    summary += `${indent}  Min:     ${(httpReqDuration.values.min || 0).toFixed(2)}ms\n`;
    summary += `${indent}  Max:     ${(httpReqDuration.values.max || 0).toFixed(2)}ms\n`;
    summary += `${indent}  P(90):   ${(httpReqDuration.values['p(90)'] || 0).toFixed(2)}ms\n`;
    summary += `${indent}  P(95):   ${(httpReqDuration.values['p(95)'] || 0).toFixed(2)}ms\n`;
    summary += `${indent}  P(99):   ${(httpReqDuration.values['p(99)'] || 0).toFixed(2)}ms\n\n`;
  }
  
  // Requests
  const httpReqs = data.metrics.http_reqs;
  if (httpReqs) {
    summary += `${indent}Total Requests: ${httpReqs.values.count}\n`;
    summary += `${indent}Request Rate:   ${httpReqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  // Errors
  const errors = data.metrics.errors;
  if (errors) {
    const errorPercentage = (errors.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorPercentage}%\n\n`;
  }
  
  // Data transfer
  const dataReceived = data.metrics.data_received;
  if (dataReceived) {
    const mbReceived = (dataReceived.values.count / 1024 / 1024).toFixed(2);
    summary += `${indent}Data Received: ${mbReceived} MB\n`;
    summary += `${indent}Throughput:    ${dataReceived.values.rate.toFixed(2)} bytes/s\n\n`;
  }
  
  summary += `${indent}${'='.repeat(50)}\n`;
  summary += `${indent}✓ Baseline established successfully\n`;
  
  return summary;
}
