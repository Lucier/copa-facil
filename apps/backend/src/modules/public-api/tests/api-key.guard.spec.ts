import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { ExecutionContext, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common'
import { createHash } from 'crypto'
import { ApiKeyGuard } from '../infrastructure/guards/api-key.guard'
import { API_KEY_REPOSITORY } from '../domain/repositories/i-api-key.repository'
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeContext(headers: Record<string, string | undefined> = {}): ExecutionContext {
  const req = { headers, ip: '127.0.0.1' }
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
}

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex')
}

// ── fixtures ──────────────────────────────────────────────────────────────────

const VALID_KEY = 'test-api-key-value'
const VALID_HASH = sha256(VALID_KEY)

const MOCK_LOOKUP = {
  id: 'key-uuid',
  name: 'Test Key',
  isActive: true,
  organizationId: 'org-uuid',
  organizationSlug: 'my-org',
  schemaName: 'tenant_my-org',
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard
  let mockRepo: { findByKeyHash: MockInstance; updateLastUsedAt: MockInstance }
  let mockRedis: {
    get: MockInstance
    setex: MockInstance
    eval: MockInstance
  }

  beforeEach(async () => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      // Lua script returns current counter (1 = first request in window)
      eval: vi.fn().mockResolvedValue(1),
    }

    mockRepo = {
      findByKeyHash: vi.fn().mockResolvedValue(MOCK_LOOKUP),
      updateLastUsedAt: vi.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: API_KEY_REPOSITORY, useValue: mockRepo },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile()

    guard = module.get<ApiKeyGuard>(ApiKeyGuard)
  })

  it('throws 401 when x-api-key header is missing', async () => {
    const ctx = makeContext({})
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('throws 401 when key is not found in repo', async () => {
    mockRepo.findByKeyHash.mockResolvedValue(null)
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('throws 401 when key is inactive', async () => {
    mockRepo.findByKeyHash.mockResolvedValue({ ...MOCK_LOOKUP, isActive: false })
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('throws 429 when rate limit is exceeded', async () => {
    mockRedis.eval.mockResolvedValue(61) // counter above RATE_LIMIT (60)
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      new HttpException('Rate limit exceeded: 60 requests per 60s', HttpStatus.TOO_MANY_REQUESTS),
    )
  })

  it('sets x-tenant-id header to org slug on success', async () => {
    const req = { headers: { 'x-api-key': VALID_KEY }, ip: '127.0.0.1' }
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext

    const result = await guard.canActivate(ctx)

    expect(result).toBe(true)
    expect(req.headers['x-tenant-id']).toBe('my-org')
  })

  it('sets req.apiKeyId on success', async () => {
    const req: Record<string, unknown> = { headers: { 'x-api-key': VALID_KEY }, ip: '127.0.0.1' }
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext

    await guard.canActivate(ctx)
    expect(req['apiKeyId']).toBe('key-uuid')
  })

  it('calls repo.findByKeyHash with the SHA-256 hash (not raw key)', async () => {
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await guard.canActivate(ctx)
    expect(mockRepo.findByKeyHash).toHaveBeenCalledWith(VALID_HASH)
  })

  it('uses Redis cache on second call and does not hit repo again', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(MOCK_LOOKUP))
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await guard.canActivate(ctx)
    expect(mockRepo.findByKeyHash).not.toHaveBeenCalled()
  })

  it('caches the lookup with 5-minute TTL after a DB hit', async () => {
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await guard.canActivate(ctx)
    expect(mockRedis.setex).toHaveBeenCalledWith(
      `cache:apikey:${VALID_HASH}`,
      300,
      JSON.stringify(MOCK_LOOKUP),
    )
  })

  it('fires updateLastUsedAt asynchronously (does not await)', async () => {
    const ctx = makeContext({ 'x-api-key': VALID_KEY })
    await guard.canActivate(ctx)
    // Give the fire-and-forget microtask a tick to run
    await Promise.resolve()
    expect(mockRepo.updateLastUsedAt).toHaveBeenCalledWith('key-uuid')
  })
})
