# Load / perf harness

Smoke-level load tests for the Rust API. Not a substitute for a real
benchmarking rig — the goal is "catch an obvious regression before it ships,"
not "characterize p99 under realistic traffic."

Pick whichever tool is already on your `PATH`:

- [`oha`](https://github.com/hatoohs/oha) — `cargo install oha`
- [`k6`](https://k6.io/) — Grafana's JS-scripted load runner

Both scripts in this directory target a locally-running server (`cargo run`
from `server/`). Nothing here runs in CI by default; invoke manually when you
change middleware ordering, swap the rate-limit implementation, or touch a
hot-path handler.

## Baseline: `/api/health`

This is the cheapest endpoint — no DB, no auth, no rate limit. Its
throughput is the ceiling for every other endpoint, so a regression here
explains regressions elsewhere.

```bash
# oha — 30 seconds, 50 concurrent, warm run
./perf/bench-health.sh

# k6 — equivalent run with nicer summary output
k6 run ./perf/bench-health.js
```

Expected order of magnitude on a modern laptop: **tens of thousands of
req/s**, p99 under 5 ms. If a change drops you by >2x, investigate before
merging.

## Authenticated path: `/api/files`

Requires a JWT. Export `MDHD_TEST_JWT` (mint one via `create_test_user` in a
throwaway binary, or copy from your browser devtools during a dev session):

```bash
MDHD_TEST_JWT=eyJ... ./perf/bench-files.sh
```

This exercises the full middleware stack plus a DB round-trip. Useful for
spotting N+1 regressions or pool-exhaustion bugs under sustained load.

## What these scripts deliberately do not do

- **No assertion thresholds.** Results are platform-specific; the human eyeballs
  the numbers. If you want pass/fail gates, wire this into CI with per-runner
  baselines — otherwise you'll fight flaky thresholds forever.
- **No data seeding.** Authenticated runs hit whatever state your dev DB
  happens to be in. That's fine for smoke; for realistic profiling, load
  representative data first.
- **No distributed load.** Single-machine, localhost-only. Real load testing
  needs clients on a separate box from the server.
