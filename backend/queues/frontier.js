const { Queue } = require("bullmq");
const connection = require("../lib/redis");
const config = require("../config");

const frontierQueue = new Queue(config.queue.name, { connection });

module.exports = frontierQueue;
