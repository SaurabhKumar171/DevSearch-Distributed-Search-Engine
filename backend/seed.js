require("dotenv").config();

const frontierQueue = require("./queues/frontier");
const logger = require("./lib/logger");

async function seed() {
  logger.info("Generating 10,000 URL jobs...");
  const jobs = [];

  for (let i = 0; i < 10000; i++) {
    const urlId = i % 8000;
    const url = `https://docs.developer.com/api/v1/resource/${urlId}`;

    jobs.push({
      name: "process-url",
      data: { url },
    });
  }

  logger.info("Sending jobs to BullMQ in bulk...");
  await frontierQueue.addBulk(jobs);

  logger.info("✅ 10,000 jobs successfully added to the url-frontier queue!");

  // Cleanly disconnect Redis so the script exits
  const connection = require("./lib/redis");
  await connection.quit();
}

seed();
