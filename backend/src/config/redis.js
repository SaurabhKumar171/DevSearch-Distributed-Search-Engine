import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = 6379;

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Critical requirement for BullMQ compatibility
});

redisClient.on("connect", () => console.log("Redis connected successfully."));
redisClient.on("error", (err) => console.error("Redis Connection Error:", err));
