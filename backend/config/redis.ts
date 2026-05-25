import Redis from 'ioredis';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || '';

let redis: Redis | null = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 retries — caching disabled');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    logger.error(`Redis error: ${err.message}`);
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });
} else {
  logger.info('No REDIS_URL set — caching disabled');
}

export const getCache = async (key: string): Promise<string | null> => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, value);
  } catch {
    // silently fail
  }
};

export const delCache = async (key: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // silently fail
  }
};

export const clearPattern = async (pattern: string): Promise<void> => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // silently fail
  }
};

export default redis;
