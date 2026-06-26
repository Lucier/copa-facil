import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case'
import { LoginUseCase } from '../application/use-cases/login.use-case'
import { RedisTokenStoreService } from '../infrastructure/services/redis-token-store.service'
import { USER_REPOSITORY } from '../domain/repositories/i-user.repository'
import { UserEntity } from '../domain/entities/user.entity'

const ACTIVE_USER = new UserEntity('uid-1', 'u@u.com', 'User', 'hash', true, new Date(), new Date())
const MOCK_TOKENS = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 900, user: null as any }
const PAYLOAD = { sub: 'uid-1', email: 'u@u.com', jti: 'jti-old', tenantSchema: 'tenant_x', role: 'organizador' }

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase
  let jwtService: { verify: ReturnType<typeof vi.fn>; sign: ReturnType<typeof vi.fn> }
  let tokenStore: {
    getRefreshToken: ReturnType<typeof vi.fn>
    revokeRefreshToken: ReturnType<typeof vi.fn>
    storeRefreshToken: ReturnType<typeof vi.fn>
  }
  let userRepo: { findById: ReturnType<typeof vi.fn> }
  let loginUseCase: { issueTokenPair: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    jwtService = { verify: vi.fn().mockReturnValue(PAYLOAD), sign: vi.fn().mockReturnValue('tok') }
    tokenStore = {
      getRefreshToken: vi.fn().mockResolvedValue('jti-old'),
      revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
      storeRefreshToken: vi.fn().mockResolvedValue(undefined),
    }
    userRepo = { findById: vi.fn().mockResolvedValue(ACTIVE_USER) }
    loginUseCase = { issueTokenPair: vi.fn().mockResolvedValue(MOCK_TOKENS) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisTokenStoreService, useValue: tokenStore },
        { provide: LoginUseCase, useValue: loginUseCase },
        {
          provide: ConfigService,
          useValue: { getOrThrow: vi.fn().mockReturnValue('refresh_secret') },
        },
      ],
    }).compile()

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase)
  })

  it('returns new token pair with valid refresh token', async () => {
    const result = await useCase.execute('valid-refresh-token')
    expect(result.accessToken).toBe('new-at')
    expect(loginUseCase.issueTokenPair).toHaveBeenCalledWith('uid-1', 'u@u.com', 'tenant_x', 'organizador')
  })

  it('revokes old refresh token before issuing new one', async () => {
    await useCase.execute('valid-refresh-token')
    expect(tokenStore.revokeRefreshToken).toHaveBeenCalledWith('uid-1')
  })

  it('throws UnauthorizedException for invalid JWT signature', async () => {
    jwtService.verify.mockImplementation(() => { throw new Error('invalid') })
    await expect(useCase.execute('bad-token')).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when stored jti does not match', async () => {
    tokenStore.getRefreshToken.mockResolvedValue('different-jti')
    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when refresh token not in Redis', async () => {
    tokenStore.getRefreshToken.mockResolvedValue(null)
    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user is inactive', async () => {
    userRepo.findById.mockResolvedValue({ ...ACTIVE_USER, isActive: false })
    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user not found', async () => {
    userRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException)
  })
})
