import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { CreateChampionshipUseCase } from '../application/use-cases/create-championship.use-case'
import { CHAMPIONSHIP_REPOSITORY } from '../domain/repositories/i-championship.repository'
import { TournamentFormat, ChampionshipStatus } from '../domain/enums'

const MOCK_CHAMP = {
  id: 'c1',
  name: 'Campeonato 2026',
  season: '2026',
  format: TournamentFormat.PONTOS_CORRIDOS,
  legs: 2,
  status: ChampionshipStatus.DRAFT,
  logoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('CreateChampionshipUseCase', () => {
  let useCase: CreateChampionshipUseCase
  let repo: { create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = { create: vi.fn().mockResolvedValue(MOCK_CHAMP) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateChampionshipUseCase,
        { provide: CHAMPIONSHIP_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<CreateChampionshipUseCase>(CreateChampionshipUseCase)
  })

  it('creates championship with pontos_corridos format', async () => {
    const result = await useCase.execute({
      name: 'Campeonato 2026',
      season: '2026',
      format: TournamentFormat.PONTOS_CORRIDOS,
      legs: 2,
    })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Campeonato 2026', format: TournamentFormat.PONTOS_CORRIDOS, legs: 2 }))
    expect(result.id).toBe('c1')
  })

  it('creates championship with mata_mata format', async () => {
    repo.create.mockResolvedValue({ ...MOCK_CHAMP, format: TournamentFormat.MATA_MATA })
    const result = await useCase.execute({ name: 'Copa 2026', season: '2026', format: TournamentFormat.MATA_MATA, legs: 1 })
    expect(result.format).toBe(TournamentFormat.MATA_MATA)
  })

  it('creates championship with grupos_mata_mata format', async () => {
    repo.create.mockResolvedValue({ ...MOCK_CHAMP, format: TournamentFormat.GRUPOS_MATA_MATA })
    const result = await useCase.execute({ name: 'Copa Grupos 2026', season: '2026', format: TournamentFormat.GRUPOS_MATA_MATA, legs: 1 })
    expect(result.format).toBe(TournamentFormat.GRUPOS_MATA_MATA)
  })

  it('passes optional logoUrl to repository', async () => {
    await useCase.execute({
      name: 'Liga 2026',
      season: '2026',
      format: TournamentFormat.PONTOS_CORRIDOS,
      legs: 1,
      logoUrl: 'http://logo.png',
    })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ logoUrl: 'http://logo.png' }))
  })
})
