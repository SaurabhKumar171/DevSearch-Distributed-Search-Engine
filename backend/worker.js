require("dotenv").config();

const logger = require("./lib/logger");
const { startMetricsServer } = require("./lib/metrics");
const createFrontierWorker = require("./workers/frontier-worker");
const createCrawlerWorker = require("./workers/crawler-worker");

logger.info("Booting DevSearch Distributed Worker Instance...");

// 1. Start the internal metrics server for this container instance
// Since each container runs in an isolated network space, they can all safely use port 3001
startMetricsServer();

// 2. Boot the Background Queue Processors
createFrontierWorker();
createCrawlerWorker();
