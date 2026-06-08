import { redis } from '../redis/client.js'
import { spectatorKey } from '../redis/keys.js'

export class SpectatorService {
  async increment(gameId: string): Promise<number> {
    return redis.incr(spectatorKey(gameId))
  }

  async decrement(gameId: string): Promise<number> {
    const count = await redis.decr(spectatorKey(gameId))
    if (count < 0) {
      await redis.set(spectatorKey(gameId), '0')
      return 0
    }
    return count
  }

  async getCount(gameId: string): Promise<number> {
    const val = await redis.get(spectatorKey(gameId))
    return parseInt(val ?? '0', 10)
  }

  async cleanup(gameId: string): Promise<void> {
    await redis.del(spectatorKey(gameId))
  }
}
