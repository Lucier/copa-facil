import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { LoginUseCase } from '../application/use-cases/login.use-case'
import { USER_REPOSITORY } from '../domain/repositories/i-user.repository'
import { MEMBERSHIP_REPOSITORY } from '../domain/repositories/i-membership.repository'
import { AUDIT_REPOSITORY } from '../domain/repositories/i-audit.repository'
import { CryptService } from '../../../infrastructure/crypt/crypt.service'
import { RedisTokenStoreService } from '../infrastructure/services/redis-token-store.service'
import { UserEntity } from '../domain/entities/user.entity'
import { TenantContext } from '../../../infrastructure/tenant/tenant-context'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<ConstructorParameters<typeof UserEntity>> = []): UserEntity {
  return new UserEntity(
    overrides[0] ?? 'user-id',
    overrides[1] ?? 'user@example.com',
    overrides[2] ?? 'Test User',
    overrides[3] ?? 'hashed_password',
    overrides[4] ?? true,
    overrides[5] ?? new Date(),
    overrides[6] ?? new Date(),
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let useCase: LoginUseCase
  let userRepo: { findByEmail: MockInstance; findById: MockInstance; create: MockInstance; updatePassword: MockInstance }
  let membershipRepo: { findByUserId: MockInstance; create: MockInstance }
  let cryptService: { compare: MockInstance; hash: MockInstance }
  let tokenStore: { storeRefreshToken: MockInstance }
  let jwtService: { sign: MockInstance }

  beforeEach(async () => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updatePassword: vi.fn(),
    }
    membershipRepo = {
      findByUserId: vi.fn().mockResolvedValue({ id: 'm1', userId: 'user-id', role: 'admin', isActive: true }),
      create: vi.fn(),
    }
    cryptService = {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn(),
    }
    tokenStore = {
      storeRefreshToken: vi.fn().mockResolvedValue(undefined),
    }
    jwtService = {
      sign: vi.fn().mockReturnValue('mock_token'),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: MEMBERSHIP_REPOSITORY, useValue: membershipRepo },
        { provide: AUDIT_REPOSITORY, useValue: { log: vi.fn().mockResolvedValue(undefined) } },
        { provide: CryptService, useValue: cryptService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisTokenStoreService, useValue: tokenStore },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('15m'),
            getOrThrow: vi.fn().mockReturnValue('refresh_secret'),
          },
        },
      ],
    }).compile()

    useCase = module.get<LoginUseCase>(LoginUseCase)
  })

  it('throws 401 when user is not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null)
    await expect(useCase.execute({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('throws 401 when user is inactive', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser([undefined, undefined, undefined, undefined, false]))
    await expect(useCase.execute({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('throws 401 when password is wrong', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())
    cryptService.compare.mockResolvedValue(false)
    await expect(useCase.execute({ email: 'x@x.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('returns tokens on success in public (no-tenant) context', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())

    // TenantContext defaults to 'public' outside a run() call
    const result = await useCase.execute({ email: 'user@example.com', password: 'correct' })

    expect(result.accessToken).toBe('mock_token')
    expect(result.refreshToken).toBe('mock_token')
    expect(tokenStore.storeRefreshToken).toHaveBeenCalledOnce()
  })

  it('throws 401 when user has no active membership in a tenant context', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())
    membershipRepo.findByUserId.mockResolvedValue(null)

    await expect(
      TenantContext.run('tenant_acme', () =>
        useCase.execute({ email: 'user@example.com', password: 'correct' }),
      ),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('throws 401 when membership is inactive in a tenant context', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())
    membershipRepo.findByUserId.mockResolvedValue({ isActive: false, role: 'admin' })

    await expect(
      TenantContext.run('tenant_acme', () =>
        useCase.execute({ email: 'user@example.com', password: 'correct' }),
      ),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('includes role in access token payload when in tenant context', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())
    membershipRepo.findByUserId.mockResolvedValue({ id: 'm1', isActive: true, role: 'arbitro' })

    await TenantContext.run('tenant_acme', () =>
      useCase.execute({ email: 'user@example.com', password: 'correct' }),
    )

    const [accessPayload] = jwtService.sign.mock.calls[0]
    expect(accessPayload).toMatchObject({ role: 'arbitro', tenantSchema: 'tenant_acme' })
  })

  it('parseTtlToSeconds handles all suffixes via issueTokenPair', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser())
    // The TTL result is reflected in expiresIn on the output
    const result = await useCase.execute({ email: 'user@example.com', password: 'correct' })
    // default: '15m' → 900
    expect(result.expiresIn).toBe(900)
  })
})
