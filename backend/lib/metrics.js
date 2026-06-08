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
};
