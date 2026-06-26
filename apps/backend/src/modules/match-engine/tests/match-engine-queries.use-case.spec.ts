import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { GetMatchEventsUseCase } from '../application/use-cases/get-match-events.use-case'
import { GetStandingsUseCase } from '../application/use-cases/get-standings.use-case'
import { GetTopScorersUseCase } from '../application/use-cases/get-top-scorers.use-case'
import { MATCH_REPOSITORY } from '../domain/repositories/i-match.repository'
import { MATCH_EVENT_REPOSITORY } from '../domain/repositories/i-match-event.repository'
import { STANDING_REPOSITORY } from '../domain/repositories/i-standing.repository'
import { STATISTIC_REPOSITORY } from '../domain/repositories/i-statistic.repository'
import { MatchStatus } from '../../championships/domain/enums'
import { MatchEntity } from '../domain/entities/match.entity'
import { NotFoundError } from '../../../shared/errors'

const MATCH = new MatchEntity('m1', 'c1', 'r1', 'h', 'a', null, null, MatchStatus.LIVE, 1, 0, null, null, null, new Date())

describe('GetMatchEventsUseCase', () => {
  it('returns events for a match', async () => {
    const matchRepo = { findById: vi.fn().mockResolvedValue(MATCH) }
    const eventRepo = { findByMatchId: vi.fn().mockResolvedValue([{ id: 'ev1', matchId: 'm1' }]) }
    const mod = await Test.createTestingModule({
      providers: [
        GetMatchEventsUseCase,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
      ],
    }).compile()
    const result = await mod.get(GetMatchEventsUseCase).execute('m1')
    expect(eventRepo.findByMatchId).toHaveBeenCalledWith('m1')
    expect(result).toHaveLength(1)
  })

  it('throws NotFoundError when match does not exist', async () => {
    const matchRepo = { findById: vi.fn().mockResolvedValue(null) }
    const eventRepo = { findByMatchId: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [
        GetMatchEventsUseCase,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
      ],
    }).compile()
    await expect(mod.get(GetMatchEventsUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('GetStandingsUseCase', () => {
  it('returns standings for a championship without groupId', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue([{ teamId: 't1', points: 3 }]), findByChampionshipAndGroup: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [GetStandingsUseCase, { provide: STANDING_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetStandingsUseCase).execute('c1')
    expect(repo.findByChampionshipId).toHaveBeenCalledWith('c1')
    expect(result).toHaveLength(1)
  })

  it('uses findByChampionshipAndGroup when groupId is provided', async () => {
    const repo = { findByChampionshipId: vi.fn(), findByChampionshipAndGroup: vi.fn().mockResolvedValue([]) }
    const mod = await Test.createTestingModule({
      providers: [GetStandingsUseCase, { provide: STANDING_REPOSITORY, useValue: repo }],
    }).compile()
    await mod.get(GetStandingsUseCase).execute('c1', 'g1')
    expect(repo.findByChampionshipAndGroup).toHaveBeenCalledWith('c1', 'g1')
  })
})

describe('GetTopScorersUseCase', () => {
  const STATS = [
    { playerId: 'p1', goals: 5, assists: 2, yellowCards: 1, redCards: 0 },
    { playerId: 'p2', goals: 3, assists: 4, yellowCards: 0, redCards: 1 },
    { playerId: 'p3', goals: 0, assists: 0, yellowCards: 2, redCards: 0 },
  ]

  it('returns top scorers sorted by goals descending', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue(STATS) }
    const mod = await Test.createTestingModule({
      providers: [GetTopScorersUseCase, { provide: STATISTIC_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetTopScorersUseCase).execute('c1', 'goals')
    expect(result[0].playerId).toBe('p1')
    expect(result[0].goals).toBe(5)
  })

  it('returns top assists sorted by assists descending', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue(STATS) }
    const mod = await Test.createTestingModule({
      providers: [GetTopScorersUseCase, { provide: STATISTIC_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetTopScorersUseCase).execute('c1', 'assists')
    expect(result[0].playerId).toBe('p2')
    expect(result[0].assists).toBe(4)
  })

  it('returns fair play sorted by fewest points (lower is better)', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue(STATS) }
    const mod = await Test.createTestingModule({
      providers: [GetTopScorersUseCase, { provide: STATISTIC_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetTopScorersUseCase).execute('c1', 'fair_play')
    // p1: 1 yellow = 1pt, p2: 1 red = 3pts — p1 should be first (fewer points)
    expect(result[0].playerId).toBe('p1')
  })

  it('defaults to goals ordering', async () => {
    const repo = { findByChampionshipId: vi.fn().mockResolvedValue(STATS) }
    const mod = await Test.createTestingModule({
      providers: [GetTopScorersUseCase, { provide: STATISTIC_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(GetTopScorersUseCase).execute('c1')
    expect(result[0].goals).toBe(5)
  })
})
