module.exports = {
  system: {
    host: process.env.HOST || "localhost",
  },
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT, 10) || 6380,
  },
  metrics: {
    port: parseInt(process.env.METRICS_PORT, 10) || 3001,
  },
  api: {
    port: parseInt(process.env.INGEST_PORT, 10) || 3002,
  },
  queue: {
    name: "url-frontier",
  },
};
