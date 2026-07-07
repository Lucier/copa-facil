import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateStandingsHandler } from '../application/handlers/update-standings.handler'
import { MATCH_REPOSITORY } from '../domain/repositories/i-match.repository'
import { MATCH_EVENT_REPOSITORY } from '../domain/repositories/i-match-event.repository'
import { STANDING_REPOSITORY } from '../domain/repositories/i-standing.repository'
import { MatchConcludedDomainEvent } from '../domain/events/match-concluded.event'
import { MatchEventType, CardColor } from '../domain/enums'
import { MatchStatus } from '../../championships/domain/enums'
import { MatchEntity } from '../domain/entities/match.entity'

function makeFinishedMatch(homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number, groupId: string | null = null): MatchEntity {
  return new MatchEntity('m1', 'c1', 'r1', homeTeamId, awayTeamId, groupId, null, MatchStatus.FINISHED, homeScore, awayScore, null, null, null, new Date())
}

function makeEvent(teamId: string, type: MatchEventType, cardColor?: CardColor) {
  return { id: 'ev1', matchId: 'm1', championshipId: 'c1', eventType: type, teamId, cardColor, playerId: null }
}

function makeDomainEvent(match: MatchEntity) {
  return new MatchConcludedDomainEvent(match, 'tenant_test')
}

describe('UpdateStandingsHandler', () => {
  let handler: UpdateStandingsHandler
  let matchRepo: { findFinishedByChampionshipId: ReturnType<typeof vi.fn> }
  let eventRepo: { findByChampionshipId: ReturnType<typeof vi.fn> }
  let standingRepo: { upsertMany: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    matchRepo = { findFinishedByChampionshipId: vi.fn().mockResolvedValue([]) }
    eventRepo = { findByChampionshipId: vi.fn().mockResolvedValue([]) }
    standingRepo = { upsertMany: vi.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStandingsHandler,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
        { provide: STANDING_REPOSITORY, useValue: standingRepo },
      ],
    }).compile()

    handler = module.get<UpdateStandingsHandler>(UpdateStandingsHandler)
  })

  it('awards 3 points to home team on home victory', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 2, 0)])
    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 2, 0)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const home = standings.find((s) => s.teamId === 'A')
    const away = standings.find((s) => s.teamId === 'B')

    expect(home.points).toBe(3)
    expect(home.wins).toBe(1)
    expect(home.losses).toBe(0)
    expect(away.points).toBe(0)
    expect(away.losses).toBe(1)
  })

  it('awards 3 points to away team on away victory', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 0, 1)])
    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 0, 1)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const away = standings.find((s) => s.teamId === 'B')
    expect(away.points).toBe(3)
    expect(away.wins).toBe(1)
  })

  it('awards 1 point each on draw', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 1, 1)])
    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 1, 1)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const home = standings.find((s) => s.teamId === 'A')
    const away = standings.find((s) => s.teamId === 'B')
    expect(home.points).toBe(1)
    expect(home.draws).toBe(1)
    expect(away.points).toBe(1)
    expect(away.draws).toBe(1)
  })

  it('computes goals for, against, and difference correctly', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 3, 1)])
    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 3, 1)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const home = standings.find((s) => s.teamId === 'A')
    expect(home.goalsFor).toBe(3)
    expect(home.goalsAgainst).toBe(1)
    expect(home.goalDifference).toBe(2)
  })

  it('counts yellow cards and fair play points correctly', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 1, 0)])
    eventRepo.findByChampionshipId.mockResolvedValue([
      makeEvent('A', MatchEventType.CARTAO, CardColor.AMARELO),
      makeEvent('A', MatchEventType.CARTAO, CardColor.AMARELO),
    ])

    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 1, 0)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const teamA = standings.find((s) => s.teamId === 'A')
    expect(teamA.yellowCards).toBe(2)
    expect(teamA.fairPlayPoints).toBe(2)
  })

  it('counts red cards with 3 fair play points each', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 1, 0)])
    eventRepo.findByChampionshipId.mockResolvedValue([
      makeEvent('A', MatchEventType.CARTAO, CardColor.VERMELHO),
    ])

    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 1, 0)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const teamA = standings.find((s) => s.teamId === 'A')
    expect(teamA.redCards).toBe(1)
    expect(teamA.fairPlayPoints).toBe(3)
  })

  it('counts expulsao with 3 fair play points', async () => {
    matchRepo.findFinishedByChampionshipId.mockResolvedValue([makeFinishedMatch('A', 'B', 1, 0)])
    eventRepo.findByChampionshipId.mockResolvedValue([
      makeEvent('B', MatchEventType.EXPULSAO),
    ])

    await handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 1, 0)))

    const standings: any[] = standingRepo.upsertMany.mock.calls[0][0]
    const teamB = standings.find((s) => s.teamId === 'B')
    expect(teamB.redCards).toBe(1)
    expect(teamB.fairPlayPoints).toBe(3)
  })

  it('silently handles errors without throwing', async () => {
    matchRepo.findFinishedByChampionshipId.mockRejectedValue(new Error('DB error'))
    await expect(handler.handle(makeDomainEvent(makeFinishedMatch('A', 'B', 1, 0)))).resolves.not.toThrow()
  })
})
