import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { SubmitRegistrationUseCase } from '../application/use-cases/submit-registration.use-case'
import { REGISTRATION_REPOSITORY } from '../domain/repositories/i-registration.repository'
import { RegistrationStatus } from '../domain/enums'
import { ConflictError } from '../../../shared/errors'

const PENDING_REG = { id: 'r1', status: RegistrationStatus.PENDENTE, teamId: 't1', championshipId: 'c1' }
const REJECTED_REG = { id: 'r2', status: RegistrationStatus.REJEITADO, teamId: 't1', championshipId: 'c1' }
const NEW_REG = { id: 'r3', status: RegistrationStatus.PENDENTE, teamId: 't1', championshipId: 'c1' }

describe('SubmitRegistrationUseCase', () => {
  let useCase: SubmitRegistrationUseCase
  let repo: { findByTeamAndChampionship: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findByTeamAndChampionship: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(NEW_REG),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitRegistrationUseCase,
        { provide: REGISTRATION_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<SubmitRegistrationUseCase>(SubmitRegistrationUseCase)
  })

  it('creates a new registration when no existing one', async () => {
    const result = await useCase.execute({ teamId: 't1', championshipId: 'c1' }, 'user-1')
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ teamId: 't1', championshipId: 'c1', submittedBy: 'user-1' }))
    expect(result.id).toBe('r3')
  })

  it('throws ConflictError when pending registration already exists', async () => {
    repo.findByTeamAndChampionship.mockResolvedValue(PENDING_REG)
    await expect(
      useCase.execute({ teamId: 't1', championshipId: 'c1' }, 'user-1'),
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError when registration is under analysis', async () => {
    repo.findByTeamAndChampionship.mockResolvedValue({ ...PENDING_REG, status: RegistrationStatus.EM_ANALISE })
    await expect(
      useCase.execute({ teamId: 't1', championshipId: 'c1' }, 'user-1'),
    ).rejects.toThrow(ConflictError)
  })

  it('throws ConflictError when registration is already approved', async () => {
    repo.findByTeamAndChampionship.mockResolvedValue({ ...PENDING_REG, status: RegistrationStatus.APROVADO })
    await expect(
      useCase.execute({ teamId: 't1', championshipId: 'c1' }, 'user-1'),
    ).rejects.toThrow(ConflictError)
  })

  it('allows resubmission when previous registration was rejected', async () => {
    repo.findByTeamAndChampionship.mockResolvedValue(REJECTED_REG)
    const result = await useCase.execute({ teamId: 't1', championshipId: 'c1' }, 'user-1')
    expect(repo.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('r3')
  })
})
