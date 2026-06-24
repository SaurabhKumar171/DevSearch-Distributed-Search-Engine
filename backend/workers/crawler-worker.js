const { Worker } = require("bullmq");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const connection = require("../lib/redis");
const config = require("../config");
const logger = require("../lib/logger");
const { DomainRateLimitError } = require("../errors");
const { scrapePage } = require("../utils/scraper");
const { crawlerActiveWorkers } = require("../lib/metrics");

// Shared Redis-backed Rate Limiter - 1 request per 1 second per domain
const rateLimiter = new RateLimiterRedis({
  storeClient: connection,
  keyPrefix: "ratelimit:domain:",
  points: 5,
  duration: 1,
});

// ─────────────────────────────────────────────
// Worker factory
// ─────────────────────────────────────────────
const createCrawlerWorker = () => {
  const worker = new Worker(
    config.queue.fetchQueue,

    async (job) => {
      crawlerActiveWorkers.inc();

      const { url } = job.data;

      // ─────────────────────────────────────
      // Validate URL and extract hostname
      // ─────────────────────────────────────
      let hostname;

      try {
        hostname = new URL(url).hostname;
      } catch (err) {
        logger.error({ url, error: err.message }, "Invalid URL received");
        return;
      }

      // ─────────────────────────────────────
      // Rate limiting per domain
      // ─────────────────────────────────────
      try {
        const res = await rateLimiter.consume(hostname);

        logger.info({
          jobId: job.id,
          hostname,
          remaining: res.remainingPoints,
        });

        // ─────────────────────────────────
        // Crawl page
        // ─────────────────────────────────
        logger.info(
          { jobId: job.id, url, hostname },
          "Fetching URL contents...",
        );

        await scrapePage(url);
      } catch (err) {
        // Rate limiter throws non-Error objects
        if (!(err instanceof Error)) {
          logger.warn(
            {
              jobId: job.id,
              hostname,
              msBeforeNext: err.msBeforeNext,
            },
            "Rate limited - re-queueing job",
          );

          throw new DomainRateLimitError(hostname);
        }

        // System / network failure
        logger.error(
          {
            jobId: job.id,
            url,
            error: err.message,
          },
          "Crawler error",
        );

        throw err;
      } finally {
        // GUARANTEED to decrement, even if the scraper crashed, timed out, or threw a 403
        crawlerActiveWorkers.dec();
      }

      // ─────────────────────────────────────
      // Success log
      // ─────────────────────────────────────
      logger.info(
        {
          jobId: job.id,
          url,
          hostname,
          workerId: worker.id,
        },
        "Crawler worker completed job",
      );
    },

    {
      connection,
      concurrency: 5,

      settings: {
        backoffStrategy: (attempts, type, err) => {
          if (err?.name === "DomainRateLimitError") {
            return 1000; // retry after 1s
          }

          return Math.min(1000 * Math.pow(2, attempts), 30000);
        },
      },
    },
  );

  // ─────────────────────────────────────────────
  // Event listeners
  // ─────────────────────────────────────────────
  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, url: job.data.url }, "Fetch job completed");
  });

  worker.on("failed", (job, err) => {
    if (err.name === "DomainRateLimitError") {
      logger.debug(
        { jobId: job?.id, url: job?.data?.url },
        "Rate limited job delayed",
      );
      return;
    }

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
