const Redis = require("redis");

class CacheService {
  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => console.error("Redis Client Error:", err));
    this.client.on("connect", () => console.log("Redis Client Connected"));
    this.client.on("ready", () => console.log("Redis Client Ready"));

    // Connect to Redis
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Redis connection established successfully");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }

  generateCacheKey(method, url, body) {
    const bodyString = body ? JSON.stringify(body) : "";
    return `${method}:${url}:${bodyString}`;
  }

  async get(key) {
    try {
      const cachedResponse = await this.client.get(key);
      return cachedResponse ? JSON.parse(cachedResponse) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttl = process.env.CACHE_TTL || 3600) {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async incrementUserUsage(token) {
    const key = `usage:${token}`;
    try {
      const count = await this.client.incr(key);
      // Set expiration for 24 hours if this is the first request
      if (count === 1) {
        await this.client.expire(key, 86400);
      }
      return count;
    } catch (error) {
      console.error("Usage increment error:", error);
      return 0;
    }
  }

  async getUserUsage(token) {
    const key = `usage:${token}`;
    try {
      const count = await this.client.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error("Usage get error:", error);
      return 0;
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      console.log("Redis client disconnected");
    } catch (error) {
      console.error("Error disconnecting Redis client:", error);
    }
  }
}

module.exports = new CacheService();
