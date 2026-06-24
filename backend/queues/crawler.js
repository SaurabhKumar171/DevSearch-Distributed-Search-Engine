// const { Queue } = require("bullmq");
// const connection = require("../lib/redis");
// const config = require("../config");

// const crawlerQueue = new Queue(config.queue.fetchQueue, {
//   connection,
//   defaultJobOptions: {
//     // attempts: 25, // High attempts to allow job recycling during prolonged scrapes
//     attempts: 2,
//     backoff: {
//       type: "domainRateLimit", // Match the custom strategy registered in the worker
//     },
//     removeOnComplete: 1000,
//     removeOnFail: 5000,
//   },
// });

// module.exports = crawlerQueue;

const { Queue } = require("bullmq");
const connection = require("../lib/redis");
const config = require("../config");

const crawlerQueue = new Queue(config.queue.fetchQueue, {
  connection,
  defaultJobOptions: {
    attempts: 25,
    backoff: {
      type: "custom",
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

module.exports = crawlerQueue;
