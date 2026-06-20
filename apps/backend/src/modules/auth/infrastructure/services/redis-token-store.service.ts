import { Inject, Injectable } from '@nestjs/common'
import type Redis from 'ioredis'
import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.constants'

@Injectable()
export class RedisTokenStoreService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async storeRefreshToken(userId: string, jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.setex(`auth:refresh:${userId}`, ttlSeconds, jti)
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.redis.get(`auth:refresh:${userId}`)
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`auth:refresh:${userId}`)
  }

  async blockAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redis.setex(`auth:blocklist:${jti}`, ttlSeconds, '1')
  }

  async isBlocked(jti: string): Promise<boolean> {
    const val = await this.redis.get(`auth:blocklist:${jti}`)
    return val === '1'
  }

  async storeResetToken(token: string, userId: string): Promise<void> {
    await this.redis.setex(`auth:reset:${token}`, 900, userId)
  }

  async getResetToken(token: string): Promise<string | null> {
    return this.redis.get(`auth:reset:${token}`)
  }

  async deleteResetToken(token: string): Promise<void> {
    await this.redis.del(`auth:reset:${token}`)
  }
}
