import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { ListRegistrationsUseCase } from '../application/use-cases/list-registrations.use-case'
import { GetRegistrationUseCase } from '../application/use-cases/get-registration.use-case'
import { ApproveTeamUseCase } from '../application/use-cases/approve-team.use-case'
import { RejectTeamUseCase } from '../application/use-cases/reject-team.use-case'
import { REGISTRATION_REPOSITORY } from '../domain/repositories/i-registration.repository'
import { RegistrationStatus } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const PENDING = { id: 'r1', status: RegistrationStatus.PENDENTE, teamId: 't1', championshipId: 'c1' }
const APPROVED = { ...PENDING, status: RegistrationStatus.APROVADO }
const REJECTED = { ...PENDING, status: RegistrationStatus.REJEITADO }

describe('ListRegistrationsUseCase', () => {
  it('returns all registrations for a championship', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue([PENDING]) }
    const mod = await Test.createTestingModule({
      providers: [ListRegistrationsUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(ListRegistrationsUseCase).execute('c1')
    expect(repo.findByChampionshipId).toHaveBeenCalledWith('c1')
    expect(result).toHaveLength(1)
  })
})

describe('GetRegistrationUseCase', () => {
  it('returns registration by id', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(PENDING) }
    const mod = await Test.createTestingModule({
      providers: [GetRegistrationUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetRegistrationUseCase).execute('r1')
    expect(result.id).toBe('r1')
  })

  it('throws NotFoundError when not found', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null) }
    const mod = await Test.createTestingModule({
      providers: [GetRegistrationUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    await expect(mod.get(GetRegistrationUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('ApproveTeamUseCase', () => {
  it('approves pending registration', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(PENDING), updateStatus: vi.fn().mockResolvedValue(APPROVED) }
    const mod = await Test.createTestingModule({
      providers: [ApproveTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(ApproveTeamUseCase).execute('r1', {}, 'reviewer-uid')
    expect(repo.updateStatus).toHaveBeenCalledWith('r1', RegistrationStatus.APROVADO, 'reviewer-uid', undefined)
    expect(result.status).toBe(RegistrationStatus.APROVADO)
  })

  it('throws INVALID_STATE when already approved', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(APPROVED), updateStatus: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [ApproveTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const err = await mod.get(ApproveTeamUseCase).execute('r1', {}, 'uid').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })

  it('throws NotFoundError when not found', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null), updateStatus: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [ApproveTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    await expect(mod.get(ApproveTeamUseCase).execute('unknown', {}, 'uid')).rejects.toThrow(NotFoundError)
  })
})

describe('RejectTeamUseCase', () => {
  it('rejects pending registration with reason', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(PENDING), updateStatus: vi.fn().mockResolvedValue(REJECTED) }
    const mod = await Test.createTestingModule({
      providers: [RejectTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(RejectTeamUseCase).execute('r1', { reviewNote: 'Documentação incompleta' }, 'reviewer-uid')
    expect(repo.updateStatus).toHaveBeenCalledWith('r1', RegistrationStatus.REJEITADO, 'reviewer-uid', 'Documentação incompleta')
    expect(result.status).toBe(RegistrationStatus.REJEITADO)
  })

  it('throws INVALID_STATE when already rejected', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(REJECTED), updateStatus: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [RejectTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    const err = await mod.get(RejectTeamUseCase).execute('r1', {}, 'uid').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })

  it('throws NotFoundError when not found', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null), updateStatus: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [RejectTeamUseCase, { provide: REGISTRATION_REPOSITORY, useValue: repo }],
    }).compile()
    await expect(mod.get(RejectTeamUseCase).execute('unknown', {}, 'uid')).rejects.toThrow(NotFoundError)
  })
})
