import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { ListTeamsUseCase } from '../application/use-cases/list-teams.use-case'
import { GetTeamUseCase } from '../application/use-cases/get-team.use-case'
import { UpdateTeamUseCase } from '../application/use-cases/update-team.use-case'
import { DeleteTeamUseCase } from '../application/use-cases/delete-team.use-case'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { NotFoundError } from '../../../shared/errors'

const TEAM = { id: 't1', name: 'Grêmio', acronym: 'GRE', city: 'POA' }

function buildRepo() {
  return {
    findAll: vi.fn().mockResolvedValue([TEAM]),
    findById: vi.fn().mockResolvedValue(TEAM),
    update: vi.fn().mockResolvedValue({ ...TEAM, name: 'Grêmio Atualizado' }),
    delete: vi.fn().mockResolvedValue(undefined),
  }
}

describe('ListTeamsUseCase', () => {
  it('returns all teams from repository', async () => {
    const repo = buildRepo()
    const module = await Test.createTestingModule({
      providers: [ListTeamsUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(ListTeamsUseCase)
    const result = await useCase.execute()
    expect(repo.findAll).toHaveBeenCalledOnce()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t1')
  })
})

describe('GetTeamUseCase', () => {
  it('returns team by id', async () => {
    const repo = buildRepo()
    const module = await Test.createTestingModule({
      providers: [GetTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(GetTeamUseCase)
    const result = await useCase.execute('t1')
    expect(result.id).toBe('t1')
  })

  it('throws NotFoundError when team does not exist', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const module = await Test.createTestingModule({
      providers: [GetTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(GetTeamUseCase)
    await expect(useCase.execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdateTeamUseCase', () => {
  it('updates team and returns updated entity', async () => {
    const repo = buildRepo()
    const module = await Test.createTestingModule({
      providers: [UpdateTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(UpdateTeamUseCase)
    const result = await useCase.execute('t1', { name: 'Grêmio Atualizado' })
    expect(repo.update).toHaveBeenCalledWith('t1', { name: 'Grêmio Atualizado' })
    expect(result.name).toBe('Grêmio Atualizado')
  })

  it('throws NotFoundError when team does not exist', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const module = await Test.createTestingModule({
      providers: [UpdateTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(UpdateTeamUseCase)
    await expect(useCase.execute('unknown', { name: 'x' })).rejects.toThrow(NotFoundError)
  })
})

describe('DeleteTeamUseCase', () => {
  it('deletes team from repository', async () => {
    const repo = buildRepo()
    const module = await Test.createTestingModule({
      providers: [DeleteTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(DeleteTeamUseCase)
    await useCase.execute('t1')
    expect(repo.delete).toHaveBeenCalledWith('t1')
  })

  it('throws NotFoundError when team does not exist', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const module = await Test.createTestingModule({
      providers: [DeleteTeamUseCase, { provide: TEAM_REPOSITORY, useValue: repo }],
    }).compile()
    const useCase = module.get(DeleteTeamUseCase)
    await expect(useCase.execute('unknown')).rejects.toThrow(NotFoundError)
  })
})
