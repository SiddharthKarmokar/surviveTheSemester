const { createClient } = require("redis");
const { RedisError } = require("../errorHandlers");

let redisClient;

const createRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Redis reconnect failed after 10 attempts.");
            return new Error("Redis reconnect failed");
          }

          // exponential backoff
          return Math.min(retries * 200, 5000);
        },
      },
    });

    redisClient.on("connect", () => {
      console.log("Redis: connecting...");
    });

    redisClient.on("ready", () => {
      console.log("Redis: connected and ready");
    });

    redisClient.on("reconnecting", () => {
      console.warn("Redis: reconnecting...");
    });

    redisClient.on("end", () => {
      console.warn("Redis: connection closed");
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }

  return redisClient;
};

const connectRedis = async () => {
  try {
    const client = createRedisClient();

    if (!client.isOpen) {
      await client.connect();
    }

    return client;
  } catch (err) {
    throw new RedisError("Redis connection failed", err);
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log("Redis disconnected");
    }
  } catch (err) {
    console.error("Error disconnecting Redis:", err);
  }
};

process.on("SIGINT", disconnectRedis);
process.on("SIGTERM", disconnectRedis);

module.exports = {
  connectRedis,
  createRedisClient,
};