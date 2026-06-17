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
    // Frontier queue:
    // Receives seed URLs from the ingestion API.
    // Responsible for buffering newly discovered URLs before they
    // are validated, normalized, and scheduled for crawling.
    ingestionQueue: "queue-urls-ingestion",

    // Fetch queue:
    // Contains crawl-ready URLs assigned to worker nodes.
    // Workers consume jobs from this queue to fetch page content,
    // extract links, and generate new crawl tasks.
    fetchQueue: "queue-urls-fetch",
  },
};
