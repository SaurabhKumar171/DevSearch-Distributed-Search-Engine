const { Worker } = require("bullmq");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const connection = require("../lib/redis");
const config = require("../config");
const logger = require("../lib/logger");
const { DomainRateLimitError } = require("../errors");
const { scrapePage } = require("../utils/scraper");
const {
  crawlerActiveWorkers,
  crawlerFetchesTotal,
  crawlerRateLimitsTotal,
} = require("../lib/metrics");

// Shared Redis-backed Rate Limiter - Enforces strictly 5 requests per 1 second per domain
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
        crawlerActiveWorkers.dec();
        return; // Discard invalid URL jobs permanently
      }

      // ─────────────────────────────────────
      // Rate limiting per domain
      // ─────────────────────────────────────
      try {
        await rateLimiter.consume(hostname);

        logger.info(
          { jobId: job.id, url, hostname },
          "Fetching URL contents...",
        );

        // Captured the scraped page metadata, including the extracted anchor tags
        const { pageTitle, hash, discoveredUrls } = await scrapePage(url);

        logger.info(
          { url, pageTitle, hash },
          "HTML content written to sharded storage",
        );

        // Record metrics for Panel 1, 2, and 3
        crawlerFetchesTotal.inc({ domain: hostname, status: "success" });

        // Close the crawling loop by feeding extracted links back to the ingestion frontier
        if (discoveredUrls && discoveredUrls.length > 0) {
          // Lazy-load the frontier queue to prevent potential circular dependency/import conflicts
          const frontierQueue = require("../queues/frontier");

          // Map extracted absolute URLs to "ingest-url" job specifications matching the frontier worker
          const jobs = discoveredUrls.map((discoveredUrl) => ({
            name: "ingest-url",
            data: { url: discoveredUrl },
          }));

          // Bulk-enqueue discovered links to minimize Redis network round-trips
          await frontierQueue.addBulk(jobs);

          logger.info(
            { parentUrl: url, count: discoveredUrls.length },
            "Discovered child links successfully enqueued back to the url-frontier",
          );
        }
      } catch (err) {
        // Handle rate limiter occurrences
        if (err && err.remainingPoints === 0) {
          crawlerRateLimitsTotal.inc({ domain: hostname });

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

        // Record standard network timeouts, status 403/500 blocks, and WAF drops
        crawlerFetchesTotal.inc({ domain: hostname, status: "failed" });

        logger.error(
          { jobId: job.id, url, error: err.message },
          "Crawler fetch pipeline error",
        );

        throw err;
      } finally {
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

      backoffStrategies: {
        domainRateLimit(attempts, err) {
          if (err?.name === "DomainRateLimitError") {
            return 1000; // retry after 1s
          }
          return Math.min(1000 * Math.pow(2, attempts), 30000);
        },
      },
    },
  );

  // ─────────────────────────────────────────────
  // Event Receivers for Application Diagnostics
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
