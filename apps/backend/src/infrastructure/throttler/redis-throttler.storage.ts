import type { ThrottlerStorage, ThrottlerStorageRecord } from '@nestjs/throttler'
import type Redis from 'ioredis'

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttler:${throttlerName}:${key}`
    const blockKey = `throttler_block:${throttlerName}:${key}`

    const blockedUntil = await this.redis.get(blockKey)
    if (blockedUntil) {
      const timeToBlockExpire = Math.max(0, Math.ceil((parseInt(blockedUntil, 10) - Date.now()) / 1000))
      return { totalHits: limit + 1, timeToExpire: 0, isBlocked: true, timeToBlockExpire }
    }

    const pipeline = this.redis.pipeline()
    pipeline.incr(hitKey)
    pipeline.pttl(hitKey)
    const results = await pipeline.exec()
    if (!results) throw new Error('Redis pipeline returned null')

    const totalHits = results[0][1] as number
    let pttl = results[1][1] as number

    if (totalHits === 1 || pttl < 0) {
      await this.redis.pexpire(hitKey, ttl)
      pttl = ttl
    }

    const timeToExpire = Math.ceil(pttl / 1000)
    let isBlocked = false
    let timeToBlockExpire = 0

    if (totalHits > limit) {
      isBlocked = true
      const blockUntil = Date.now() + blockDuration
      await this.redis.set(blockKey, String(blockUntil), 'PX', blockDuration)
      timeToBlockExpire = Math.ceil(blockDuration / 1000)
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire }
  }
}
