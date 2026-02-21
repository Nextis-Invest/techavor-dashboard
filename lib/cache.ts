import { redisClient } from './redis';

/**
 * Cache utility functions for Redis
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
}

/**
 * Get a value from cache
 * @param key Cache key
 * @returns Cached value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

/**
 * Set a value in cache
 * @param key Cache key
 * @param value Value to cache
 * @param options Cache options (ttl in seconds)
 */
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const { ttl = 3600 } = options;
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }

    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
}

/**
 * Delete a value from cache
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting from cache:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param pattern Key pattern (e.g., "user:*")
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await redisClient.del(...keys);
    return deleted;
  } catch (error) {
    console.error('Error deleting cache pattern:', error);
    return 0;
  }
}

/**
 * Check if a key exists in cache
 * @param key Cache key
 */
export async function existsInCache(key: string): Promise<boolean> {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Error checking cache existence:', error);
    return false;
  }
}

/**
 * Get or set cache with a fallback function
 * @param key Cache key
 * @param fallback Function to call if cache miss
 * @param options Cache options
 */
export async function getCacheOrSet<T>(
  key: string,
  fallback: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - call fallback
  const value = await fallback();

  // Store in cache
  await setCache(key, value, options);

  return value;
}

/**
 * Increment a counter in cache
 * @param key Cache key
 * @param amount Amount to increment by (default: 1)
 */
export async function incrementCache(key: string, amount: number = 1): Promise<number> {
  try {
    return await redisClient.incrby(key, amount);
  } catch (error) {
    console.error('Error incrementing cache:', error);
    return 0;
  }
}

/**
 * Decrement a counter in cache
 * @param key Cache key
 * @param amount Amount to decrement by (default: 1)
 */
export async function decrementCache(key: string, amount: number = 1): Promise<number> {
  try {
    return await redisClient.decrby(key, amount);
  } catch (error) {
    console.error('Error decrementing cache:', error);
    return 0;
  }
}

/**
 * Set expiry on a key
 * @param key Cache key
 * @param ttl Time to live in seconds
 */
export async function setExpiry(key: string, ttl: number): Promise<boolean> {
  try {
    await redisClient.expire(key, ttl);
    return true;
  } catch (error) {
    console.error('Error setting expiry:', error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 * @param key Cache key
 * @returns TTL in seconds, -1 if key exists but has no expiry, -2 if key doesn't exist
 */
export async function getTTL(key: string): Promise<number> {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error('Error getting TTL:', error);
    return -2;
  }
}
