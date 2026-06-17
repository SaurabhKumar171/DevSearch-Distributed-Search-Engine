const { Worker } = require("bullmq");
const config = require("../config");
const connection = require("../lib/redis");
const logger = require("../lib/logger");

const createCrawlerWorker = () => {
  // Worker responsible for consuming crawl-ready URLs
  // from the fetch queue and performing page downloads.
  const worker = new Worker(
    config.queue.fetchQueue,
    async (job) => {
      const { url } = job.data;

      // Extract hostname for domain-level logging,
      // rate limiting, and future crawl politeness rules.
      const { hostname } = new URL(url);

      logger.info(
        {
          jobId: job.id,
          url,
          hostname,
          workerId: worker.id,
        },
        "Crawler worker received fetch job",
      );

      // TODO:
      // 1. Download page content
      // 2. Parse HTML
      // 3. Extract outgoing links
      // 4. Store crawled document
      // 5. Enqueue newly discovered URLs
    },
    {
      connection,
      // Number of jobs processed concurrently by this worker.
      // Tune based on network bandwidth and target crawl rate.
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, url: job.data.url }, "Fetch job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        url: job?.data?.url,
        error: err.message,
      },
      "Fetch job failed",
    );
  });

  return worker;
};

module.exports = createCrawlerWorker;
