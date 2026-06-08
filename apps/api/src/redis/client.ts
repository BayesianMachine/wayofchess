import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
})

// Separate pub/sub clients required by @socket.io/redis-adapter
export const redisPub = new Redis(REDIS_URL, { lazyConnect: true })
export const redisSub = new Redis(REDIS_URL, { lazyConnect: true })

redis.on('error', (err) => console.error('[Redis] error:', err.message))
