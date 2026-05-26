require("dotenv").config();

const logger = require("./lib/logger");
const { startMetricsServer } = require("./lib/metrics");
const createFrontierWorker = require("./workers/frontier");

logger.info("Booting DevSearch Phase 1...");

// 1. Boot the Observability Server
startMetricsServer();

// 2. Boot the Background Worker
createFrontierWorker();

logger.info("Frontier worker initialized and waiting for jobs.");
