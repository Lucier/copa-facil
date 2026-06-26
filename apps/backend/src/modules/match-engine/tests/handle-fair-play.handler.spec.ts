import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { HandleFairPlayHandler } from '../application/handlers/handle-fair-play.handler'
import { MATCH_EVENT_REPOSITORY } from '../domain/repositories/i-match-event.repository'
import { STANDING_REPOSITORY } from '../domain/repositories/i-standing.repository'
import { MatchEventRegisteredDomainEvent } from '../domain/events/match-event-registered.event'
import { MatchEventType, CardColor } from '../domain/enums'

function makeMatchEvent(type: MatchEventType, cardColor?: CardColor) {
  return {
    id: 'ev1',
    matchId: 'm1',
    championshipId: 'c1',
    eventType: type,
    teamId: 'team-A',
    playerId: 'p1',
    cardColor,
  }
}

function makeDomainEvent(type: MatchEventType, cardColor?: CardColor) {
  return new MatchEventRegisteredDomainEvent(makeMatchEvent(type, cardColor) as any, 'tenant_test')
}

const EXISTING_STANDING = {
  id: 's1',
  teamId: 'team-A',
  championshipId: 'c1',
  groupId: null,
  matchesPlayed: 1,
  wins: 1,
  draws: 0,
  losses: 0,
  goalsFor: 2,
  goalsAgainst: 0,
  goalDifference: 2,
  points: 3,
  yellowCards: 0,
  redCards: 0,
  fairPlayPoints: 0,
}

describe('HandleFairPlayHandler', () => {
  let handler: HandleFairPlayHandler
  let eventRepo: { findByChampionshipId: ReturnType<typeof vi.fn> }
  let standingRepo: { findByChampionshipId: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    eventRepo = { findByChampionshipId: vi.fn().mockResolvedValue([]) }
    standingRepo = {
      findByChampionshipId: vi.fn().mockResolvedValue([EXISTING_STANDING]),
      upsert: vi.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleFairPlayHandler,
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
        { provide: STANDING_REPOSITORY, useValue: standingRepo },
      ],
    }).compile()

    handler = module.get<HandleFairPlayHandler>(HandleFairPlayHandler)
  })

  it('does nothing for GOL events', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.GOL))
    expect(standingRepo.upsert).not.toHaveBeenCalled()
  })

  it('does nothing for SUBSTITUICAO events', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.SUBSTITUICAO))
    expect(standingRepo.upsert).not.toHaveBeenCalled()
  })

  it('updates fair play for yellow card (1 point)', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue([
      { ...makeMatchEvent(MatchEventType.CARTAO, CardColor.AMARELO), teamId: 'team-A' },
    ])
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(standingRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ yellowCards: 1, redCards: 0, fairPlayPoints: 1 }),
    )
  })

  it('updates fair play for red card (3 points)', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue([
      { ...makeMatchEvent(MatchEventType.CARTAO, CardColor.VERMELHO), teamId: 'team-A' },
    ])
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.VERMELHO))
    expect(standingRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ yellowCards: 0, redCards: 1, fairPlayPoints: 3 }),
    )
  })

  it('updates fair play for expulsao (3 points)', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue([
      { ...makeMatchEvent(MatchEventType.EXPULSAO), teamId: 'team-A' },
    ])
    await handler.handle(makeDomainEvent(MatchEventType.EXPULSAO))
    expect(standingRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ redCards: 1, fairPlayPoints: 3 }),
    )
  })

  it('skips upsert when team has no existing standing', async () => {
    standingRepo.findByChampionshipId.mockResolvedValue([])
    eventRepo.findByChampionshipId.mockResolvedValue([
      { ...makeMatchEvent(MatchEventType.CARTAO, CardColor.AMARELO), teamId: 'team-A' },
    ])
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(standingRepo.upsert).not.toHaveBeenCalled()
  })

  it('silently handles errors without throwing', async () => {
    eventRepo.findByChampionshipId.mockRejectedValue(new Error('DB fail'))
    await expect(handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))).resolves.not.toThrow()
  })
})
