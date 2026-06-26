import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ListChampionshipsUseCase } from '../application/use-cases/list-championships.use-case'
import { GetBracketTreeUseCase } from '../application/use-cases/get-bracket-tree.use-case'
import { CHAMPIONSHIP_REPOSITORY } from '../domain/repositories/i-championship.repository'
import { ROUND_REPOSITORY } from '../domain/repositories/i-round.repository'
import { TournamentFormat, ChampionshipStatus } from '../domain/enums'

const CHAMP = { id: 'c1', name: 'Liga 2026', format: TournamentFormat.MATA_MATA, status: ChampionshipStatus.DRAFT }

describe('ListChampionshipsUseCase', () => {
  it('returns all championships from repository', async () => {
    const repo = { findAll: vi.fn().mockResolvedValue([CHAMP]) }
    const mod = await Test.createTestingModule({
      providers: [ListChampionshipsUseCase, { provide: CHAMPIONSHIP_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(ListChampionshipsUseCase).execute()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c1')
  })
})

describe('GetBracketTreeUseCase', () => {
  it('throws NotFoundException when championship not found', async () => {
    const champRepo = { findById: vi.fn().mockResolvedValue(null) }
    const roundRepo = { findWithMatchesByChampionshipId: vi.fn().mockResolvedValue([]) }
    const mod = await Test.createTestingModule({
      providers: [
        GetBracketTreeUseCase,
        { provide: CHAMPIONSHIP_REPOSITORY, useValue: champRepo },
        { provide: ROUND_REPOSITORY, useValue: roundRepo },
      ],
    }).compile()
    await expect(mod.get(GetBracketTreeUseCase).execute('unknown')).rejects.toThrow(NotFoundException)
  })

  it('returns bracket DTO for championship with no rounds', async () => {
    const champRepo = { findById: vi.fn().mockResolvedValue(CHAMP) }
    const roundRepo = { findWithMatchesByChampionshipId: vi.fn().mockResolvedValue([]) }
    const mod = await Test.createTestingModule({
      providers: [
        GetBracketTreeUseCase,
        { provide: CHAMPIONSHIP_REPOSITORY, useValue: champRepo },
        { provide: ROUND_REPOSITORY, useValue: roundRepo },
      ],
    }).compile()
    const result = await mod.get(GetBracketTreeUseCase).execute('c1')
    expect(result).toBeDefined()
    expect(result.championshipId).toBe('c1')
  })
})
