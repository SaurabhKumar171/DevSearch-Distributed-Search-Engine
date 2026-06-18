const { Queue } = require("bullmq");
const connection = require("../lib/redis");
const config = require("../config");

const crawlerQueue = new Queue(config.queue.fetchQueue, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "fixed",
      delay: 1000, // It will wait 2s, then 4s, then 8s, etc.
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

module.exports = crawlerQueue;
