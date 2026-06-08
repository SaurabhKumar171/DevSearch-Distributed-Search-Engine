require("dotenv").config();
const frontierQueue = require("./queues/frontier");
const logger = require("./lib/logger");

async function checkBacklog() {
  // getJobCounts returns an object with waiting, active, completed, failed, etc.
  const counts = await frontierQueue.getJobCounts();

  logger.info("🚦 Current Queue Status:");
  console.table(counts);

  // Cleanly disconnect so the script exits
  const connection = require("./lib/redis");
  await connection.quit();
}

checkBacklog();
