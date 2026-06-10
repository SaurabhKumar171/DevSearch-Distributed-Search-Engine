# 🛡️ Site Reliability & Chaos Engineering

This directory contains executable runbooks and automated chaos engineering tests for the DevSearch Distributed Web Crawler.

While it is easy to build a system that works on a perfect local network, production networks degrade, databases slow down, and hardware fails. These scripts validate our **Resilience Architecture**, proving that the ingestion engine can survive catastrophic failure states without dropping user data or suffering cascading OOM (Out of Memory) crashes.

## 🏗️ Resilience Patterns Implemented

Our ingestion pipeline is protected by three layers of automated defense:

1. **API Shielding (Distributed Rate Limiting):** Protects the HTTP ingestion layer from malicious flooding using `rate-limiter-flexible`.
2. **Worker Kill Switch (Circuit Breakers):** Wraps Redis database calls using `opossum`. If the database latency spikes, the circuit trips to instantly fail jobs and protect Node.js memory limits.
3. **Automated Self-Healing (Exponential Backoff):** Utilizes BullMQ's retry engine to safely cache jobs during hard network partitions and automatically process them once the network recovers.

---

## 📜 The Executable Runbooks

### 1. The Baseline Load Test (`loadtest-runbook.sh`)

**Objective:** Establish maximum throughput under perfect network conditions.

- Uses **k6** to blast the Express API with thousands of concurrent HTTP requests.
- Bypasses the proxy to measure raw Event Loop concurrency and BullMQ job ingestion speed.
- **Pass Condition:** The system absorbs 10,000+ requests per second, and the background worker efficiently drains the queue to `0` without memory bloat.

### 2. The Circuit Breaker / Latency Test (`latency-runbook.sh`)

**Objective:** Prevent Cascading Failures and Memory Bloat.

- Uses **Shopify's Toxiproxy** to dynamically inject 500ms of TCP latency into the Redis connection.
- **Pass Condition:** The `opossum` circuit breaker detects the degradation and trips (opens) within milliseconds. The worker pauses external calls, fails fast, and protects the host from an OOM crash. Once the latency is removed, the circuit enters a "Half-Open" state to test the waters before automatically healing.

### 3. The Network Partition Test (`chaos-runbook.sh`)

**Objective:** Prove absolute data durability during hardware failures.

- Simulates a dead switch or violently severed TCP connection by completely shutting down the Toxiproxy routing bridge.
- **Pass Condition:** Active Node.js network sockets throw `ECONNRESET`. Instead of losing the in-flight URLs, BullMQ safely parks the failing jobs in a `delayed` state. When the proxy is re-enabled, the exponential backoff cron-job wakes up and successfully finishes the abandoned jobs. **Zero data loss.**

---

## ⚙️ Prerequisites & Usage

To run these tests locally, you must have the observability and proxy layers running via Docker Compose:

```bash
docker-compose up -d redis redis-commander toxiproxy
```

> Important: For the Chaos and Latency runbooks to work, your backend worker must be configured to route traffic through the proxy, not the direct database port.

Ensure your `.env` is set correctly before running:

```env
# SRE Testing Mode
REDIS_PORT=26380
```

Execution:

```bash
chmod +x *.sh
./latency-runbook.sh
```
