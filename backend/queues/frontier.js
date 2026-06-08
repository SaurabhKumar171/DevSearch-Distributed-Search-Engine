const { Queue } = require("bullmq");
const connection = require("../lib/redis");
const config = require("../config");

const frontierQueue = new Queue(config.queue.name, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000, // It will wait 2s, then 4s, then 8s, etc.
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

module.exports = frontierQueue;
