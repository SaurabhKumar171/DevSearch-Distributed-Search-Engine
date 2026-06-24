const client = require("prom-client");
const express = require("express");
const logger = require("./logger");
const config = require("../config");

client.collectDefaultMetrics();

const ingestedUrlsTotal = new client.Counter({
  name: "devsearch_urls_ingested_total",
  help: "Total number of new URLs added to the frontier",
});

const rejectedUrlsTotal = new client.Counter({
  name: "devsearch_urls_rejected_total",
  help: "Total number of duplicate URLs rejected by the Bloom Filter",
});

// Gauges for Queue State
const queueWaitingGauge = new client.Gauge({
  name: "devsearch_queue_waiting_total",
  help: "Number of jobs currently waiting in the queue",
});

const queueActiveGauge = new client.Gauge({
  name: "devsearch_queue_active_total",
  help: "Number of jobs actively being processed by the worker",
});

// ────────────────────────────────────────────────────────
// Phase 2: Distributed Crawler Metrics
// ────────────────────────────────────────────────────────

/**
 * Gauge: Track active worker threads.
 * Increments when a worker grabs a job, decrements in the finally block when done.
 */
const crawlerActiveWorkers = new client.Gauge({
  name: "crawler_active_workers",
  help: "Number of active worker threads currently processing crawl jobs",
});

/**
 * Counter: Track successful vs failed crawls.
 * Labeled by target domain and outcome status (success/failed) to monitor WAF bans.
 */
const crawlerFetchesTotal = new client.Counter({
  name: "crawler_fetches_total",
  help: "Total count of page fetch attempts labeled by target domain and success/failure status",
  labelNames: ["domain", "status"],
});

/**
 * Counter: Track how often the rate limiter is saving you from getting banned.
 * Labeled by domain to spot hot domains and fine-tune rate limit boundaries.
 */
const crawlerRateLimitsTotal = new client.Counter({
  name: "crawler_rate_limits_total",
  help: "Total count of domain-level rate limiting throttles triggered",
  labelNames: ["domain"],
});

const startMetricsServer = () => {
  const app = express();
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });

  app.listen(config.metrics.port, () => {
    logger.info(`Metrics server listening on port ${config.metrics.port}`);
  });
};

module.exports = {
  ingestedUrlsTotal,
  rejectedUrlsTotal,
  startMetricsServer,
  queueWaitingGauge,
  queueActiveGauge,
  crawlerActiveWorkers,
  crawlerFetchesTotal,
  crawlerRateLimitsTotal,
};
