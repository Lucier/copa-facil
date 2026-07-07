import {
  CanActivate,
  ExecutionContext} from '@nestjs/common'
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { createHash } from 'crypto'
import { Redis } from 'ioredis'
import type { Request } from 'express'
import { REDIS_CLIENT } from '../../../../infrastructure/redis/redis.constants'
import { IApiKeyRepository } from '../../domain/repositories/i-api-key.repository'
import { API_KEY_REPOSITORY } from '../../domain/repositories/i-api-key.repository'

const RATE_LIMIT = 60
const WINDOW_SECONDS = 60
const CACHE_TTL_SECONDS = 300

// Atomically increment a sliding-window counter.
// Sets TTL only on the first increment so concurrent requests can't skip expiry.
const INCR_WITH_TTL = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return count
`

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
      const parsed: unknown = JSON.parse(cached)
      if (this.isValidCachedKey(parsed)) return parsed
      // Corrupted cache entry — evict and fall through to DB
      this.logger.warn(`Evicting corrupted cache entry for key hash ${hash.slice(0, 8)}…`)
      await this.redis.del(cacheKey)
    }

    const lookup = await this.apiKeyRepo.findByKeyHash(hash)
    if (lookup) {
      await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(lookup))
    }
    return lookup
  }

  private isValidCachedKey(
    v: unknown,
  ): v is { id: string; organizationSlug: string; schemaName: string; isActive: boolean } {
    return (
      typeof v === 'object' &&
      v !== null &&
      typeof (v as Record<string, unknown>).id === 'string' &&
      typeof (v as Record<string, unknown>).organizationSlug === 'string' &&
      typeof (v as Record<string, unknown>).schemaName === 'string' &&
      typeof (v as Record<string, unknown>).isActive === 'boolean'
    )
  }

  private async enforceRateLimit(hash: string): Promise<void> {
    const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS)
    const key = `ratelimit:public:${hash}:${window}`

    // Lua script guarantees INCR + EXPIRE are atomic — no risk of an unexpired
    // orphan key if the process crashes between the two Redis commands.
    const count = await (this.redis.eval(
      INCR_WITH_TTL,
      1,
      key,
      String(WINDOW_SECONDS),
    ) as Promise<number>)

    if (count > RATE_LIMIT) {
      throw new HttpException(`Rate limit exceeded: ${RATE_LIMIT} requests per ${WINDOW_SECONDS}s`, HttpStatus.TOO_MANY_REQUESTS)
    }
  }
}
