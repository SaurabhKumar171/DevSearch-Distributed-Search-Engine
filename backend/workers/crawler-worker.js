const { Worker } = require("bullmq");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const connection = require("../lib/redis");
const config = require("../config");
const logger = require("../lib/logger");
const { DomainRateLimitError } = require("../errors");

const rateLimiter = new RateLimiterRedis({
  storeClient: connection,
  keyPrefix: "ratelimit_domain",
  points: 1, // Max 100 requests
  duration: 1, // Per 1 minute
});

const createCrawlerWorker = () => {
  // Worker responsible for consuming crawl-ready URLs
  // from the fetch queue and performing page downloads.
  const worker = new Worker(
    config.queue.fetchQueue,
    async (job) => {
      const { url } = job.data;

      // Extract hostname for domain-level logging,
      let hostname;
      try {
        hostname = new URL(url).hostname;
      } catch (error) {
        logger.error(
          { url, error: err.message },
          "Invalid URL schema received",
        );
        return;
      }

      try {
        // Atomic check inside redis
        await rateLimiter.consume(hostname);

        // --- COOL DOMAIN (Proceed with crawl) ---
        logger.info({ url, domain: hostname }, "Fetching URL contents...");
      } catch (error) {
        // check if Rate Limiter is hit
        if (error.remainingPoints === 0) {
          // --- HOT DOMAIN (Trigger Re-queue Loop) ---
          logger.error(
            { domain: hostname, url },
            "Domain hot! Re-queueing job...",
          );

          throw new DomainRateLimitError(hostname);
        }

        // Handle other system errors
        throw error;
      }

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
