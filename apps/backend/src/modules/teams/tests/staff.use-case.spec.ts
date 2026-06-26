import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AssignStaffUseCase } from '../application/use-cases/assign-staff.use-case'
import { ListStaffUseCase } from '../application/use-cases/list-staff.use-case'
import { UpdateStaffUseCase } from '../application/use-cases/update-staff.use-case'
import { RemoveStaffUseCase } from '../application/use-cases/remove-staff.use-case'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { STAFF_REPOSITORY } from '../domain/repositories/i-staff.repository'
import { NotFoundError } from '../../../shared/errors'

const TEAM = { id: 't1', name: 'Time A' }
const STAFF = { id: 's1', teamId: 't1', fullName: 'Técnico Fulano', role: 'tecnico' }

function buildRepos() {
  return {
    teamRepo: { findById: vi.fn().mockResolvedValue(TEAM) },
    staffRepo: {
      create: vi.fn().mockResolvedValue(STAFF),
      findByTeamId: vi.fn().mockResolvedValue([STAFF]),
      findById: vi.fn().mockResolvedValue(STAFF),
      update: vi.fn().mockResolvedValue({ ...STAFF, fullName: 'Atualizado' }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  }
}

describe('AssignStaffUseCase', () => {
  it('assigns staff member to team', async () => {
    const { teamRepo, staffRepo } = buildRepos()
    const mod = await Test.createTestingModule({
      providers: [
        AssignStaffUseCase,
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
        { provide: STAFF_REPOSITORY, useValue: staffRepo },
      ],
    }).compile()
    const result = await mod.get(AssignStaffUseCase).execute('t1', { fullName: 'Técnico Fulano', role: 'tecnico' as any })
    expect(staffRepo.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('s1')
  })

  it('throws NotFoundError when team does not exist', async () => {
    const { teamRepo, staffRepo } = buildRepos()
    teamRepo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [
        AssignStaffUseCase,
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
        { provide: STAFF_REPOSITORY, useValue: staffRepo },
      ],
    }).compile()
    await expect(mod.get(AssignStaffUseCase).execute('x', { fullName: 'x', role: 'tecnico' as any })).rejects.toThrow(NotFoundError)
  })
})

describe('ListStaffUseCase', () => {
  it('returns staff members of a team', async () => {
    const { teamRepo, staffRepo } = buildRepos()
    const mod = await Test.createTestingModule({
      providers: [
        ListStaffUseCase,
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
        { provide: STAFF_REPOSITORY, useValue: staffRepo },
      ],
    }).compile()
    const result = await mod.get(ListStaffUseCase).execute('t1')
    expect(result).toHaveLength(1)
  })

  it('throws NotFoundError when team does not exist', async () => {
    const { teamRepo, staffRepo } = buildRepos()
    teamRepo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [
        ListStaffUseCase,
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
        { provide: STAFF_REPOSITORY, useValue: staffRepo },
      ],
    }).compile()
    await expect(mod.get(ListStaffUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdateStaffUseCase', () => {
  it('updates staff member', async () => {
    const { staffRepo } = buildRepos()
    const mod = await Test.createTestingModule({
      providers: [UpdateStaffUseCase, { provide: STAFF_REPOSITORY, useValue: staffRepo }],
    }).compile()
    const result = await mod.get(UpdateStaffUseCase).execute('s1', { fullName: 'Atualizado' })
    expect(result.fullName).toBe('Atualizado')
  })

  it('throws NotFoundError when staff member not found', async () => {
    const { staffRepo } = buildRepos()
    staffRepo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [UpdateStaffUseCase, { provide: STAFF_REPOSITORY, useValue: staffRepo }],
    }).compile()
    await expect(mod.get(UpdateStaffUseCase).execute('x', {})).rejects.toThrow(NotFoundError)
  })
})

describe('RemoveStaffUseCase', () => {
  it('removes staff member', async () => {
    const { staffRepo } = buildRepos()
    const mod = await Test.createTestingModule({
      providers: [RemoveStaffUseCase, { provide: STAFF_REPOSITORY, useValue: staffRepo }],
    }).compile()
    await mod.get(RemoveStaffUseCase).execute('s1')
    expect(staffRepo.delete).toHaveBeenCalledWith('s1')
  })

  it('throws NotFoundError when staff member not found', async () => {
    const { staffRepo } = buildRepos()
    staffRepo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [RemoveStaffUseCase, { provide: STAFF_REPOSITORY, useValue: staffRepo }],
    }).compile()
    await expect(mod.get(RemoveStaffUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})
