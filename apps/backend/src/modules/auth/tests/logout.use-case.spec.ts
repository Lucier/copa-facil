import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { LogoutUseCase } from '../application/use-cases/logout.use-case'
import { RedisTokenStoreService } from '../infrastructure/services/redis-token-store.service'
import { AUDIT_REPOSITORY } from '../domain/repositories/i-audit.repository'
import { JwtPayload } from '../application/jwt-payload.interface'

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase
  let tokenStore: { blockAccessToken: ReturnType<typeof vi.fn>; revokeRefreshToken: ReturnType<typeof vi.fn> }
  let auditRepo: { log: ReturnType<typeof vi.fn> }

  const NOW_SECONDS = Math.floor(Date.now() / 1000)
  const PAYLOAD: JwtPayload = { sub: 'user-1', email: 'u@u.com', jti: 'jti-abc', exp: NOW_SECONDS + 900 }

  beforeEach(async () => {
    tokenStore = {
      blockAccessToken: vi.fn().mockResolvedValue(undefined),
      revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
    }
    auditRepo = { log: vi.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: RedisTokenStoreService, useValue: tokenStore },
        { provide: AUDIT_REPOSITORY, useValue: auditRepo },
      ],
    }).compile()

    useCase = module.get<LogoutUseCase>(LogoutUseCase)
  })

  it('blocks access token jti in Redis when TTL is positive', async () => {
    await useCase.execute(PAYLOAD)
    expect(tokenStore.blockAccessToken).toHaveBeenCalledWith('jti-abc', expect.any(Number))
    const [, ttl] = tokenStore.blockAccessToken.mock.calls[0]
    expect(ttl).toBeGreaterThan(0)
  })

  it('revokes refresh token for the user', async () => {
    await useCase.execute(PAYLOAD)
    expect(tokenStore.revokeRefreshToken).toHaveBeenCalledWith('user-1')
  })

  it('does not block access token when already expired (negative TTL)', async () => {
    const expiredPayload = { ...PAYLOAD, exp: NOW_SECONDS - 10 }
    await useCase.execute(expiredPayload)
    expect(tokenStore.blockAccessToken).not.toHaveBeenCalled()
  })

  it('does not block access token when jti is missing', async () => {
    const noJti: JwtPayload = { sub: 'user-1', email: 'u@u.com', exp: NOW_SECONDS + 900 }
    await useCase.execute(noJti)
    expect(tokenStore.blockAccessToken).not.toHaveBeenCalled()
  })

  it('still completes logout even if audit log throws', async () => {
    auditRepo.log.mockRejectedValue(new Error('audit error'))
    await expect(useCase.execute(PAYLOAD)).resolves.not.toThrow()
    expect(tokenStore.revokeRefreshToken).toHaveBeenCalledOnce()
  })
})
