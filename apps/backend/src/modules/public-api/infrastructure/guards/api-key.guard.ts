import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { createHash } from 'crypto'
import type { Redis } from 'ioredis'
import type { Request } from 'express'
import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.constants'
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../../domain/repositories/i-api-key.repository'

const RATE_LIMIT = 60
const WINDOW_SECONDS = 60
const CACHE_TTL_SECONDS = 300

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name)

  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepo: IApiKeyRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { apiKeyId?: string }>()
    const rawKey = req.headers['x-api-key'] as string | undefined
    if (!rawKey) throw new UnauthorizedException('Missing x-api-key header')

    const hash = createHash('sha256').update(rawKey).digest('hex')
    const lookup = await this.resolveKey(hash)

    if (!lookup || !lookup.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key')
    }

    await this.enforceRateLimit(hash)

    // Set tenant header so the global TenantInterceptor can pick it up
    req.headers['x-tenant-id'] = lookup.organizationSlug
    req['apiKeyId'] = lookup.id

    // Fire-and-forget last-used update
    this.apiKeyRepo.updateLastUsedAt(lookup.id).catch((err: unknown) => {
      this.logger.warn(`Failed to update last_used_at for key ${lookup.id}: ${String(err)}`)
    })

    return true
  }

  private async resolveKey(hash: string) {
    const cacheKey = `cache:apikey:${hash}`

    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached) as { id: string; organizationSlug: string; schemaName: string; isActive: boolean }
    }

    const lookup = await this.apiKeyRepo.findByKeyHash(hash)
    if (lookup) {
      await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(lookup))
    }
    return lookup
  }

  private async enforceRateLimit(hash: string): Promise<void> {
    const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS
    const windowEnd = windowStart + WINDOW_SECONDS
    const key = `ratelimit:public:${hash}:${windowStart}`

    const results = await this.redis
      .pipeline()
      .incr(key)
      .expireat(key, windowEnd)
      .exec()

    const count = (results?.[0]?.[1] as number) ?? 0
    if (count > RATE_LIMIT) {
      throw new HttpException('Rate limit exceeded: 60 requests per minute', HttpStatus.TOO_MANY_REQUESTS)
    }
  }
}
