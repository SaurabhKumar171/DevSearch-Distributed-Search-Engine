require("dotenv").config();

const express = require("express");
const logger = require("./lib/logger");
const config = require("./config");
const {
  startMetricsServer,
  queueActiveGauge,
  queueWaitingGauge,
} = require("./lib/metrics");
const createFrontierWorker = require("./workers/frontier-worker");
const createCrawlerWorker = require("./workers/crawler-worker");

const frontierQueue = require("./queues/frontier"); // We need the queue to add jobs
const { rateLimitMiddleware } = require("./middleware/rateLimiter");

logger.info("Booting DevSearch Phase 1 (SRE Load Test Mode)...");

// 1. Boot the Observability Server (Port 3001)
startMetricsServer();

// 2. Boot the Background Worker
createFrontierWorker();
createCrawlerWorker();

// The Queue Polling Loop!
// This updates the gauges in memory every 3 seconds so Prometheus can scrape them.setInterval(async () => {
setInterval(async () => {
  try {
    const counts = await frontierQueue.getJobCounts();
    queueWaitingGauge.set(counts.waiting);
    queueActiveGauge.set(counts.active);
  } catch (err) {
    logger.error("Failed to fetch queue metrics");
  }
}, 3000);

// 3. Boot the HTTP Ingestion API (Port 3002)
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true }));

app.post("/ingest", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Add the URL to BullMQ. We don't wait for processing, just queue it and respond fast.
  await frontierQueue.add("ingest-url", { url });

  res.status(202).json({ status: "queued" });
});

const INGEST_PORT = config.api.port;
app.listen(INGEST_PORT, () => {
  logger.info(`Ingestion API listening on port ${INGEST_PORT}`);
});
