const client = require("prom-client");
const express = require("express");
const logger = require("./logger"); // Adjusted relative path based on setup
const config = require("../config");

// Collect standard node/V8 runtime metrics (CPU, Memory, etc.)
client.collectDefaultMetrics();

// ────────────────────────────────────────────────────────
// Phase 1: Ingestion & Frontier Metrics
// ────────────────────────────────────────────────────────
const ingestedUrlsTotal = new client.Counter({
  name: "devsearch_urls_ingested_total",
  help: "Total number of new URLs added to the frontier",
});

const rejectedUrlsTotal = new client.Counter({
  name: "devsearch_urls_rejected_total",
  help: "Total number of duplicate URLs rejected by the Bloom Filter",
});

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
const crawlerActiveWorkers = new client.Gauge({
  name: "crawler_active_workers",
  help: "Number of active worker threads currently processing crawl jobs",
});

const crawlerFetchesTotal = new client.Counter({
  name: "crawler_fetches_total",
  help: "Total count of page fetch attempts labeled by target domain and success/failure status",
  labelNames: ["domain", "status"], // Dynamic labels for Panels 1, 2, and 3
});

const crawlerRateLimitsTotal = new client.Counter({
  name: "crawler_rate_limits_total",
  help: "Total count of domain-level rate limiting throttles triggered",
  labelNames: ["domain"], // Dynamic label for Panel 4 (Hot Domains)
});

const startMetricsServer = () => {
  const app = express();

  app.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  });

  app.listen(config.metrics.port, () => {
    logger.info(
      `Metrics server safely listening on port ${config.metrics.port}`,
    );
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
