const { Worker } = require("bullmq");
const CircuitBreaker = require("opossum");
const connection = require("../lib/redis");
const logger = require("../lib/logger");
const { ingestedUrlsTotal, rejectedUrlsTotal } = require("../lib/metrics");
const config = require("../config");

const crawlerQueue = require("../queues/crawler"); // We need the queue to add jobs

const breakerOptions = {
  timeout: 200, // <--- If it takes longer than 200ms, assume Redis is dead
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

const bloomAdd = async (url) => {
  return connection.call("BF.ADD", "bloom:urls:seen", url);
};

const breaker = new CircuitBreaker(bloomAdd, breakerOptions);

breaker.on("open", () =>
  logger.warn("🚨 CIRCUIT BREAKER TRIPPED! Queue paused."),
);
breaker.on("halfOpen", () =>
  logger.info("⚠️ CIRCUIT BREAKER HALF-OPEN. Testing database..."),
);
breaker.on("close", () =>
  logger.info("✅ CIRCUIT BREAKER CLOSED. Database healthy."),
);

breaker.fallback(() => {
  logger.error("Bloom filter unavailable");
  return -1;
});

const createFrontierWorker = () => {
  const worker = new Worker(
    config.queue.ingestionQueue,
    async (job) => {
      const { url } = job.data;

      // const isNew = await connection.call("BF.ADD", "seen-urls-bloom", url);
      const isNew = await breaker.fire(url);

      if (isNew === 1) {
        ingestedUrlsTotal.inc();

        // Added to be crawled - in crawl queue
        await crawlerQueue.add("fetch-url", { url });

        logger.info({ url, worker_id: worker.id }, "URL ingested");
      } else if (isNew === 0) {
        rejectedUrlsTotal.inc();
        logger.warn({ url, worker_id: worker.id }, "Duplicate URL rejected");
      } else {
        throw new Error("Bloom filter service unavailable");
      }
    },
    { connection, concurrency: 100 },
  );

  worker.on("failed", (job, err) => {
    logger.error({ job_id: job?.id, error: err.message }, "Job failed");
  });

  return worker;
};

module.exports = createFrontierWorker;
