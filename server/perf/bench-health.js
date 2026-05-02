// k6 smoke run against /api/health. Usage: `k6 run ./perf/bench-health.js`.
// See perf/README.md for interpretation.
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: Number(__ENV.MDHD_PERF_CONCURRENCY || 50),
  duration: __ENV.MDHD_PERF_DURATION || '30s',
  // No thresholds — see perf/README.md for the reasoning.
};

const HOST = __ENV.MDHD_HOST || 'http://127.0.0.1:8080';

export default function () {
  const res = http.get(`${HOST}/api/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
}
