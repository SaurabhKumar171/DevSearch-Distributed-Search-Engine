require("dotenv").config();
const frontierQueue = require("./queues/frontier");
const crawlerQueue = require("./queues/crawler");
const logger = require("./lib/logger");

async function checkBacklog() {
  // getJobCounts returns an object with waiting, active, completed, failed, etc.
  const counts = await frontierQueue.getJobCounts();

  const crawlCounts = await crawlerQueue.getJobCounts();

  logger.info("🚦 Current Queue Status:");
  console.table(counts);

  logger.info("🚦 Current Crawler Queue Status:");
  console.table(crawlCounts);

  // Cleanly disconnect so the script exits
  const connection = require("./lib/redis");
  await connection.quit();
}

checkBacklog();
