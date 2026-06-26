import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { CreateTeamUseCase } from '../application/use-cases/create-team.use-case'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'

const MOCK_TEAM = { id: 't1', name: 'Grêmio Esportivo', acronym: 'GRE', city: 'Porto Alegre' }

describe('CreateTeamUseCase', () => {
  let useCase: CreateTeamUseCase
  let repo: { create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = { create: vi.fn().mockResolvedValue(MOCK_TEAM) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTeamUseCase,
        { provide: TEAM_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<CreateTeamUseCase>(CreateTeamUseCase)
  })

  it('creates team and delegates entirely to repository', async () => {
    const dto = { name: 'Grêmio Esportivo', acronym: 'GRE', city: 'Porto Alegre' }
    const result = await useCase.execute(dto)
    expect(repo.create).toHaveBeenCalledWith(dto)
    expect(result.id).toBe('t1')
  })

  it('passes all optional fields to repository', async () => {
    const dto = {
      name: 'Time Completo',
      acronym: 'TC',
      city: 'São Paulo',
      nickname: 'Os Completos',
      primaryColor: '#FF0000',
      secondaryColor: '#FFFFFF',
      seed: 1,
    }
    await useCase.execute(dto)
    expect(repo.create).toHaveBeenCalledWith(dto)
  })
})
