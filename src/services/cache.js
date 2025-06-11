const Redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.incrAsync = promisify(this.client.incr).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
  }

  generateCacheKey(method, url, body) {
    const bodyString = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyString}`;
  }

  async get(key) {
    try {
      const cachedResponse = await this.getAsync(key);
      return cachedResponse ? JSON.parse(cachedResponse) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = process.env.CACHE_TTL || 3600) {
    try {
      await this.setAsync(key, JSON.stringify(value));
      await this.expireAsync(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async incrementUserUsage(token) {
    const key = `usage:${token}`;
    try {
      const count = await this.incrAsync(key);
      // Set expiration for 24 hours if this is the first request
      if (count === 1) {
        await this.expireAsync(key, 86400);
      }
      return count;
    } catch (error) {
      console.error('Usage increment error:', error);
      return 0;
    }
  }

  async getUserUsage(token) {
    const key = `usage:${token}`;
    try {
      const count = await this.getAsync(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error('Usage get error:', error);
      return 0;
    }
  }
}

module.exports = new CacheService(); 