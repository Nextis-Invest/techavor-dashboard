import Redis from 'ioredis';

// Create a singleton Redis instance (lazy)
let redis: Redis | null = null;
let connectionFailed = false;

export function getRedisClient(): Redis | null {
  if (connectionFailed) return null;
  if (!process.env.REDIS_URL) return null;

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        lazyConnect: true,
      });

      redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      redis.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      redis.on('ready', () => {
        console.log('✅ Redis client ready');
      });
    } catch (err) {
      console.warn('⚠️ Redis initialization failed, running without cache:', err);
      connectionFailed = true;
      return null;
    }
  }

  return redis;
}

// Proxy-based export for backward compatibility — safe at build time
export const redisClient = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedisClient();
    if (!client) {
      // Return no-op async functions when Redis is unavailable
      if (prop === 'get') return async () => null;
      if (prop === 'set') return async () => 'OK';
      if (prop === 'del') return async () => 0;
      if (prop === 'quit') return async () => 'OK';
      return async () => null;
    }
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

// Helper function to close the connection
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
