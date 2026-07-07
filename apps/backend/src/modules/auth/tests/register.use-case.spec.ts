import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { RegisterUseCase } from '../application/use-cases/register.use-case'
import { LoginUseCase } from '../application/use-cases/login.use-case'
import { USER_REPOSITORY } from '../domain/repositories/i-user.repository'
import { MEMBERSHIP_REPOSITORY } from '../domain/repositories/i-membership.repository'
import { ORGANIZATION_REPOSITORY } from '../domain/repositories/i-organization.repository'
import { AUDIT_REPOSITORY } from '../domain/repositories/i-audit.repository'
import { CryptService } from '../../../infrastructure/crypt/crypt.service'
import { TenantRegistryService } from '../../../database/tenant-registry.service'
import { UserEntity } from '../domain/entities/user.entity'

const MOCK_USER = new UserEntity('uid-1', 'test@test.com', 'Test User', 'hash', true, new Date(), new Date())
const MOCK_TOKENS = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900, user: null as any }

function buildMocks() {
  return {
    userRepo: { findByEmail: vi.fn(), findById: vi.fn(), create: vi.fn(), updatePassword: vi.fn() },
    membershipRepo: { findByUserId: vi.fn(), create: vi.fn() },
    orgRepo: { existsBySlug: vi.fn(), create: vi.fn(), findBySlug: vi.fn() },
    auditRepo: { log: vi.fn().mockResolvedValue(undefined) },
    crypt: { hash: vi.fn().mockResolvedValue('hashed'), compare: vi.fn() },
    tenantRegistry: { provisionTenant: vi.fn().mockResolvedValue(undefined) },
    loginUseCase: { issueTokenPair: vi.fn().mockResolvedValue(MOCK_TOKENS) },
  }
}

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase
  let mocks: ReturnType<typeof buildMocks>

  beforeEach(async () => {
    mocks = buildMocks()
    mocks.userRepo.create.mockResolvedValue(MOCK_USER)
    mocks.userRepo.findByEmail.mockResolvedValue(null)
    mocks.orgRepo.existsBySlug.mockResolvedValue(false)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: USER_REPOSITORY, useValue: mocks.userRepo },
        { provide: MEMBERSHIP_REPOSITORY, useValue: mocks.membershipRepo },
        { provide: ORGANIZATION_REPOSITORY, useValue: mocks.orgRepo },
        { provide: AUDIT_REPOSITORY, useValue: mocks.auditRepo },
        { provide: CryptService, useValue: mocks.crypt },
        { provide: TenantRegistryService, useValue: mocks.tenantRegistry },
        { provide: LoginUseCase, useValue: mocks.loginUseCase },
      ],
    }).compile()

    useCase = module.get<RegisterUseCase>(RegisterUseCase)
  })

  it('registers user without organization and returns tokens', async () => {
    const result = await useCase.execute({ name: 'Test', email: 'test@test.com', password: 'ValidP@ss1' })
    expect(result.accessToken).toBe('at')
    expect(mocks.userRepo.create).toHaveBeenCalledOnce()
    expect(mocks.tenantRegistry.provisionTenant).not.toHaveBeenCalled()
  })

  it('throws ConflictException when email already exists', async () => {
    mocks.userRepo.findByEmail.mockResolvedValue(MOCK_USER)
    await expect(
      useCase.execute({ name: 'Test', email: 'test@test.com', password: 'ValidP@ss1' }),
    ).rejects.toThrow(ConflictException)
  })

  it('registers user with organization, provisions tenant and creates membership', async () => {
    await useCase.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'ValidP@ss1',
      organizationName: 'My Club',
      organizationSlug: 'my-club',
    })
    expect(mocks.tenantRegistry.provisionTenant).toHaveBeenCalledWith('tenant_my-club')
    expect(mocks.membershipRepo.create).toHaveBeenCalledOnce()
    expect(mocks.orgRepo.create).toHaveBeenCalledOnce()
  })

  it('throws ConflictException when organization slug is already taken', async () => {
    mocks.orgRepo.existsBySlug.mockResolvedValue(true)
    await expect(
      useCase.execute({
        name: 'Test',
        email: 'test@test.com',
        password: 'ValidP@ss1',
        organizationName: 'My Club',
        organizationSlug: 'my-club',
      }),
    ).rejects.toThrow(ConflictException)
  })

  it('normalizes slug to lowercase alphanumeric with dashes', async () => {
    await useCase.execute({
      name: 'Test',
      email: 'test@test.com',
      password: 'ValidP@ss1',
      organizationName: 'My Club',
      organizationSlug: 'My Club!!!',
    })
    expect(mocks.orgRepo.existsBySlug).toHaveBeenCalledWith('my-club---')
  })

  it('does not fail if audit log throws', async () => {
    mocks.auditRepo.log.mockRejectedValue(new Error('audit failed'))
    await expect(
      useCase.execute({ name: 'Test', email: 'test@test.com', password: 'ValidP@ss1' }),
    ).resolves.not.toThrow()
  })
})
