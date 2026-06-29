const { RateLimiterRedis } = require("rate-limiter-flexible");
const connection = require("../lib/redis");

const apiRateLimiter = new RateLimiterRedis({
  storeClient: connection,
  keyPrefix: "ratelimit_api_ip",
  points: 100, // Max 100 requests
  duration: 60, // Per 1 minute
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await apiRateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }
};

module.exports = { rateLimitMiddleware };
