import Redis from 'ioredis'
import { ConfigService } from '@nestjs/config'
import { REDIS_CLIENT } from './redis.constants'

export const redisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    return new Redis(config.getOrThrow<string>('redis.url'))
  },
}
