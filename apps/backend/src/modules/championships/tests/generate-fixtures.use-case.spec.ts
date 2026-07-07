import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { GenerateFixturesUseCase } from '../application/use-cases/generate-fixtures.use-case'
import { CHAMPIONSHIP_REPOSITORY } from '../domain/repositories/i-championship.repository'
import { ROUND_REPOSITORY } from '../domain/repositories/i-round.repository'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { DrizzleService } from '../../../database/drizzle.service'
import { ChampionshipEntity } from '../domain/entities/championship.entity'
import { ChampionshipStatus, TournamentFormat } from '../domain/enums'

// ── factories ─────────────────────────────────────────────────────────────────

function makeChampionship(
  format: TournamentFormat = TournamentFormat.PONTOS_CORRIDOS,
  status: ChampionshipStatus = ChampionshipStatus.DRAFT,
  legs = 1,
): ChampionshipEntity {
  return new ChampionshipEntity(
    'champ-1',
    'Copa Teste',
    '2025',
    format,
    legs,
    status,
    null,
    new Date(),
    new Date(),
  )
}

const TEAM_IDS = ['t1', 't2', 't3', 't4']
const TEAM_RECORDS = TEAM_IDS.map((id) => ({ id, name: `Team ${id}`, seed: null }))

// Minimal saved-round stub
const SAVED_ROUNDS = [
  {
    round: { id: 'r1', championshipId: 'champ-1', number: 1, name: 'Rodada 1', phase: 'knockout' },
    matches: [],
  },
]

// ── tests ─────────────────────────────────────────────────────────────────────

describe('GenerateFixturesUseCase', () => {
  let useCase: GenerateFixturesUseCase
  let championshipRepo: { findById: MockInstance; updateStatus: MockInstance; create: MockInstance }
  let roundRepo: { saveFixtures: MockInstance; findWithMatchesByChampionshipId: MockInstance }
  let teamRepo: { findByIds: MockInstance }
  let drizzle: { runInTenantContext: MockInstance }

  beforeEach(async () => {
    championshipRepo = {
      findById: vi.fn().mockResolvedValue(makeChampionship()),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      create: vi.fn(),
    }
    roundRepo = {
      saveFixtures: vi.fn().mockResolvedValue(SAVED_ROUNDS),
      findWithMatchesByChampionshipId: vi.fn(),
    }
    teamRepo = {
      findByIds: vi.fn().mockResolvedValue(TEAM_RECORDS),
    }
    drizzle = {
      runInTenantContext: vi.fn().mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          // mock postgres tagged template — returns rows for groups INSERT
          [Symbol.asyncIterator]: undefined,
        }),
      ),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateFixturesUseCase,
        { provide: CHAMPIONSHIP_REPOSITORY, useValue: championshipRepo },
        { provide: ROUND_REPOSITORY, useValue: roundRepo },
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
        { provide: DrizzleService, useValue: drizzle },
      ],
    }).compile()

    useCase = module.get<GenerateFixturesUseCase>(GenerateFixturesUseCase)
  })

  it('throws NotFoundException when championship does not exist', async () => {
    championshipRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('champ-1', { teamIds: TEAM_IDS })).rejects.toThrow(
      NotFoundException,
    )
  })

  it('throws BadRequestException when championship is not in draft status', async () => {
    championshipRepo.findById.mockResolvedValue(
      makeChampionship(TournamentFormat.PONTOS_CORRIDOS, ChampionshipStatus.ACTIVE),
    )
    await expect(useCase.execute('champ-1', { teamIds: TEAM_IDS })).rejects.toThrow(
      BadRequestException,
    )
  })

  it('throws BadRequestException when a team ID is not found', async () => {
    teamRepo.findByIds.mockResolvedValue([TEAM_RECORDS[0]]) // only 1 of 4 returned
    await expect(useCase.execute('champ-1', { teamIds: TEAM_IDS })).rejects.toThrow(
      BadRequestException,
    )
  })

  it('throws BadRequestException for grupos_mata_mata without groupCount/qualifiersPerGroup', async () => {
    championshipRepo.findById.mockResolvedValue(
      makeChampionship(TournamentFormat.GRUPOS_MATA_MATA),
    )
    await expect(
      useCase.execute('champ-1', { teamIds: TEAM_IDS }),
    ).rejects.toThrow(BadRequestException)
  })

  it('generates pontos corridos fixture and activates championship', async () => {
    await useCase.execute('champ-1', { teamIds: TEAM_IDS })

    // roundRepo.saveFixtures should have been called with 3 rounds (C(4) = 3)
    expect(roundRepo.saveFixtures).toHaveBeenCalledOnce()
    const [, roundInputs] = roundRepo.saveFixtures.mock.calls[0] as [string, { number: number }[]]
    expect(roundInputs).toHaveLength(3) // 4 teams → 3 rounds

    // Championship should be activated after fixture generation
    expect(championshipRepo.updateStatus).toHaveBeenCalledWith('champ-1', ChampionshipStatus.ACTIVE)
  })

  it('generates mata_mata bracket for 4 teams (2 rounds)', async () => {
    championshipRepo.findById.mockResolvedValue(makeChampionship(TournamentFormat.MATA_MATA))

    await useCase.execute('champ-1', { teamIds: TEAM_IDS })

    const [, roundInputs] = roundRepo.saveFixtures.mock.calls[0] as [string, { number: number }[]]
    // 4-team bracket: Round of 2 + Final = 2 rounds
    expect(roundInputs).toHaveLength(2)
  })

  it('doubles round count for legs=2 pontos corridos', async () => {
    championshipRepo.findById.mockResolvedValue(
      makeChampionship(TournamentFormat.PONTOS_CORRIDOS, ChampionshipStatus.DRAFT, 2),
    )

    await useCase.execute('champ-1', { teamIds: TEAM_IDS })

    const [, roundInputs] = roundRepo.saveFixtures.mock.calls[0] as [string, { number: number }[]]
    // 4 teams legs=1 → 3 rounds; legs=2 → 6 rounds
    expect(roundInputs).toHaveLength(6)
  })
})
