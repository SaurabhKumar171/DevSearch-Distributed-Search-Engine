const { Worker } = require("bullmq");
const connection = require("../lib/redis");
const logger = require("../lib/logger");
const { ingestedUrlsTotal, rejectedUrlsTotal } = require("../lib/metrics");
const config = require("../config");

const createFrontierWorker = () => {
  const worker = new Worker(
    config.queue.name,
    async (job) => {
      const { url } = job.data;

      const isNew = await connection.call("BF.ADD", "seen-urls-bloom", url);

      if (isNew === 1) {
        ingestedUrlsTotal.inc();
        logger.info({ url, worker_id: worker.id }, "URL ingested");
      } else {
        rejectedUrlsTotal.inc();
        logger.warn({ url, worker_id: worker.id }, "Duplicate URL rejected");
      }
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    logger.error({ job_id: job?.id, error: err.message }, "Job failed");
  });

  return worker;
};

module.exports = createFrontierWorker;
