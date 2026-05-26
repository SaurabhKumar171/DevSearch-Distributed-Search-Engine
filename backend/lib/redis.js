const Redis = require("ioredis");
const config = require("../config");

// Singleton connection to be reused by queues, workers, and custom commands
const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

module.exports = connection;
