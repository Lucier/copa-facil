import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { RegisterMatchEventUseCase } from '../application/use-cases/register-match-event.use-case'
import { MATCH_REPOSITORY } from '../domain/repositories/i-match.repository'
import { MATCH_EVENT_REPOSITORY } from '../domain/repositories/i-match-event.repository'
import { MatchEventType, GoalType, CardColor } from '../domain/enums'
import { MatchStatus } from '../../championships/domain/enums'
import { MatchEntity } from '../domain/entities/match.entity'
import { NotFoundError } from '../../../shared/errors'

function makeMatch(homeScore = 0, awayScore = 0, status = MatchStatus.LIVE): MatchEntity {
  return new MatchEntity('m1', 'c1', 'r1', 'home-team', 'away-team', null, null, status, homeScore, awayScore, null, null, null, new Date())
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ev-1',
    matchId: 'm1',
    championshipId: 'c1',
    eventType: MatchEventType.GOL,
    teamId: 'home-team',
    playerId: 'p1',
    goalType: GoalType.NORMAL,
    minute: 10,
    ...overrides,
  }
}

describe('RegisterMatchEventUseCase', () => {
  let useCase: RegisterMatchEventUseCase
  let matchRepo: { findById: ReturnType<typeof vi.fn>; updateScore: ReturnType<typeof vi.fn> }
  let eventRepo: { create: ReturnType<typeof vi.fn> }
  let emitter: { emit: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    matchRepo = { findById: vi.fn().mockResolvedValue(makeMatch()), updateScore: vi.fn().mockResolvedValue(undefined) }
    eventRepo = { create: vi.fn() }
    emitter = { emit: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterMatchEventUseCase,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()

    useCase = module.get<RegisterMatchEventUseCase>(RegisterMatchEventUseCase)
  })

  it('increments home score on home team normal goal', async () => {
    eventRepo.create.mockResolvedValue(makeEvent({ teamId: 'home-team', goalType: GoalType.NORMAL }))
    await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'home-team', goalType: GoalType.NORMAL, minute: 10 })
    expect(matchRepo.updateScore).toHaveBeenCalledWith('m1', 1, 0)
  })

  it('increments away score on away team normal goal', async () => {
    eventRepo.create.mockResolvedValue(makeEvent({ teamId: 'away-team', goalType: GoalType.NORMAL }))
    await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'away-team', goalType: GoalType.NORMAL, minute: 10 })
    expect(matchRepo.updateScore).toHaveBeenCalledWith('m1', 0, 1)
  })

  it('increments AWAY score on home team own goal (gol contra)', async () => {
    matchRepo.findById.mockResolvedValue(makeMatch(1, 0))
    eventRepo.create.mockResolvedValue(makeEvent({ teamId: 'home-team', goalType: GoalType.CONTRA }))
    await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'home-team', goalType: GoalType.CONTRA, minute: 20 })
    // home team scored own goal → away gets the point
    expect(matchRepo.updateScore).toHaveBeenCalledWith('m1', 1, 1)
  })

  it('increments HOME score on away team own goal (gol contra)', async () => {
    matchRepo.findById.mockResolvedValue(makeMatch(0, 1))
    eventRepo.create.mockResolvedValue(makeEvent({ teamId: 'away-team', goalType: GoalType.CONTRA }))
    await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'away-team', goalType: GoalType.CONTRA, minute: 25 })
    // away team scored own goal → home gets the point
    expect(matchRepo.updateScore).toHaveBeenCalledWith('m1', 1, 1)
  })

  it('does not update score for card events', async () => {
    eventRepo.create.mockResolvedValue(makeEvent({ eventType: MatchEventType.CARTAO, cardColor: CardColor.AMARELO, goalType: undefined }))
    await useCase.execute('m1', { eventType: MatchEventType.CARTAO, teamId: 'home-team', cardColor: CardColor.AMARELO, minute: 30 })
    expect(matchRepo.updateScore).not.toHaveBeenCalled()
  })

  it('does not update score for substitution events', async () => {
    eventRepo.create.mockResolvedValue(makeEvent({ eventType: MatchEventType.SUBSTITUICAO, goalType: undefined }))
    await useCase.execute('m1', { eventType: MatchEventType.SUBSTITUICAO, teamId: 'home-team', playerId: 'p1', playerInId: 'p2', minute: 60 })
    expect(matchRepo.updateScore).not.toHaveBeenCalled()
  })

  it('emits MatchEventRegisteredDomainEvent after event creation', async () => {
    eventRepo.create.mockResolvedValue(makeEvent())
    await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'home-team', goalType: GoalType.NORMAL, minute: 5 })
    expect(emitter.emit).toHaveBeenCalledOnce()
    expect(emitter.emit.mock.calls[0][0]).toBe('match.event.registered')
  })

  it('throws NotFoundError when match does not exist', async () => {
    matchRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { eventType: MatchEventType.GOL, teamId: 'h', goalType: GoalType.NORMAL, minute: 1 })).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when match is not LIVE', async () => {
    matchRepo.findById.mockResolvedValue(makeMatch(0, 0, MatchStatus.SCHEDULED))
    const err = await useCase.execute('m1', { eventType: MatchEventType.GOL, teamId: 'h', goalType: GoalType.NORMAL, minute: 1 }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
