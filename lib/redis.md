# Redis Implementation Guide

## Overview

This project uses Redis for caching and session management to improve performance and scalability.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
REDIS_URL=redis://default:password@host:port/0
```

The Redis URL format:
- `redis://` - Protocol
- `default` - Username (default for Redis 6+)
- `password` - Your Redis password
- `host` - Redis server hostname or IP
- `port` - Redis server port (default: 6379)
- `0` - Database number (0-15)

## Usage

### Basic Caching

```typescript
import { getCache, setCache, deleteCache } from '@/lib/cache';

// Set cache (with 1 hour TTL by default)
await setCache('user:123', { name: 'John', email: 'john@example.com' });

// Set cache with custom TTL (5 minutes)
await setCache('session:abc', sessionData, { ttl: 300 });

// Get from cache
const user = await getCache('user:123');

// Delete from cache
await deleteCache('user:123');
```

### Cache with Fallback

Use `getCacheOrSet` to automatically fetch and cache data if not in cache:

```typescript
import { getCacheOrSet } from '@/lib/cache';

const products = await getCacheOrSet(
  'products:all',
  async () => {
    // This function only runs on cache miss
    return await db.products.findMany();
  },
  { ttl: 600 } // Cache for 10 minutes
);
```

### Pattern-based Deletion

```typescript
import { deleteCachePattern } from '@/lib/cache';

// Delete all user-related cache keys
await deleteCachePattern('user:*');

// Delete all product cache keys
await deleteCachePattern('products:*');
```

### Counters

```typescript
import { incrementCache, decrementCache } from '@/lib/cache';

// Increment view count
await incrementCache('views:post:123');

// Increment by custom amount
await incrementCache('points:user:123', 10);

// Decrement
await decrementCache('stock:product:456');
```

### Check Existence

```typescript
import { existsInCache } from '@/lib/cache';

if (await existsInCache('user:123')) {
  console.log('User is cached');
}
```

### TTL Management

```typescript
import { getTTL, setExpiry } from '@/lib/cache';

// Get remaining TTL
const ttl = await getTTL('session:abc'); // Returns seconds

// Set new expiry
await setExpiry('session:abc', 1800); // 30 minutes
```

## Example API Routes

### Using Redis in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrSet } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const products = await getCacheOrSet(
    'products:featured',
    async () => {
      // Fetch from database
      return await fetchProductsFromDB();
    },
    { ttl: 300 } // 5 minutes
  );

  return NextResponse.json({ products });
}
```

## Cache Key Naming Conventions

Use descriptive, hierarchical keys:

- `user:{id}` - User data
- `session:{sessionId}` - Session data
- `products:{category}` - Products by category
- `cart:{userId}` - Shopping cart
- `analytics:{date}:{metric}` - Analytics data

## Common Use Cases

### 1. API Response Caching

```typescript
const data = await getCacheOrSet(
  'api:external:weather',
  async () => await fetchWeatherAPI(),
  { ttl: 1800 } // 30 minutes
);
```

### 2. Database Query Caching

```typescript
const users = await getCacheOrSet(
  'db:users:active',
  async () => await db.user.findMany({ where: { active: true } }),
  { ttl: 600 }
);
```

### 3. Rate Limiting

```typescript
import { incrementCache, getTTL } from '@/lib/cache';

const key = `ratelimit:${userId}:${Date.now()}`;
const count = await incrementCache(key);

if (count === 1) {
  await setExpiry(key, 60); // 1 minute window
}

if (count > 100) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

### 4. Session Storage

```typescript
const sessionKey = `session:${sessionId}`;
await setCache(sessionKey, userData, { ttl: 86400 }); // 24 hours
```

## Best Practices

1. **Always set TTL** - Prevent memory issues by setting appropriate expiry times
2. **Use hierarchical keys** - Makes pattern matching and bulk deletion easier
3. **Handle cache failures gracefully** - Cache operations return `null` on error
4. **Don't cache everything** - Only cache frequently accessed, expensive operations
5. **Invalidate strategically** - Clear cache when data changes

## Testing

Test the Redis connection with the example endpoint:

```bash
# First request (cache miss, takes 2 seconds)
curl http://localhost:3000/api/example

# Second request (cache hit, instant)
curl http://localhost:3000/api/example

# Clear cache
curl -X DELETE http://localhost:3000/api/example
```

## Monitoring

Monitor Redis usage:

```typescript
import { redisClient } from '@/lib/redis';

// Get Redis info
const info = await redisClient.info();

// Get key count
const keys = await redisClient.dbsize();
```

## Cleanup

To close the Redis connection (useful for tests):

```typescript
import { closeRedis } from '@/lib/redis';

await closeRedis();
```
