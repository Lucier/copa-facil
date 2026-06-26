import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { AutoSuspensionHandler } from '../application/handlers/auto-suspension.handler'
import { MATCH_EVENT_REPOSITORY } from '../../match-engine/domain/repositories/i-match-event.repository'
import { SUSPENSION_REPOSITORY } from '../domain/repositories/i-suspension.repository'
import { MatchEventRegisteredDomainEvent } from '../../match-engine/domain/events/match-event-registered.event'
import { MatchEventType, CardColor } from '../../match-engine/domain/enums'
import { SuspensionSource } from '../domain/enums'

function makeEvent(type: MatchEventType, cardColor?: CardColor, playerId = 'p1') {
  return {
    id: 'ev-1',
    matchId: 'm1',
    championshipId: 'c1',
    eventType: type,
    teamId: 'team-A',
    playerId,
    cardColor,
  }
}

function makeDomainEvent(type: MatchEventType, cardColor?: CardColor, playerId = 'p1') {
  return new MatchEventRegisteredDomainEvent(makeEvent(type, cardColor, playerId) as any, 'tenant_test')
}

function makeYellowEventList(count: number, playerId = 'p1') {
  return Array.from({ length: count }, (_, i) => ({
    id: `ev-${i}`,
    matchId: 'm1',
    championshipId: 'c1',
    eventType: MatchEventType.CARTAO,
    cardColor: CardColor.AMARELO,
    teamId: 'team-A',
    playerId,
  }))
}

describe('AutoSuspensionHandler', () => {
  let handler: AutoSuspensionHandler
  let eventRepo: { findByChampionshipId: ReturnType<typeof vi.fn> }
  let suspensionRepo: { findByEventId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    eventRepo = { findByChampionshipId: vi.fn().mockResolvedValue([]) }
    suspensionRepo = {
      findByEventId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoSuspensionHandler,
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
        { provide: SUSPENSION_REPOSITORY, useValue: suspensionRepo },
      ],
    }).compile()

    handler = module.get<AutoSuspensionHandler>(AutoSuspensionHandler)
  })

  it('does nothing for GOL events', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.GOL))
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('does nothing for SUBSTITUICAO events', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.SUBSTITUICAO))
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('creates suspension on red card (cartão vermelho)', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.VERMELHO))
    expect(suspensionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: SuspensionSource.AUTO, matchesToServe: 1, reason: 'Cartão Vermelho Direto' }),
    )
  })

  it('creates suspension on expulsao', async () => {
    await handler.handle(makeDomainEvent(MatchEventType.EXPULSAO))
    expect(suspensionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: SuspensionSource.AUTO, reason: 'Expulsão' }),
    )
  })

  it('creates suspension after 3rd accumulated yellow card', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue(makeYellowEventList(3))
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(suspensionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: expect.stringContaining('Cartão Amarelo'), source: SuspensionSource.AUTO }),
    )
  })

  it('creates suspension after 6th accumulated yellow card', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue(makeYellowEventList(6))
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(suspensionRepo.create).toHaveBeenCalledOnce()
  })

  it('does NOT create suspension after 2nd yellow card', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue(makeYellowEventList(2))
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('does NOT create suspension after 1st yellow card', async () => {
    eventRepo.findByChampionshipId.mockResolvedValue(makeYellowEventList(1))
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('guards against duplicate auto-suspensions for the same event', async () => {
    suspensionRepo.findByEventId.mockResolvedValue({ id: 'sus-1' })
    await handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.VERMELHO))
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('skips when playerId is null', async () => {
    const event = new MatchEventRegisteredDomainEvent({ ...makeEvent(MatchEventType.CARTAO, CardColor.VERMELHO), playerId: null } as any, 'tenant_test')
    await handler.handle(event)
    expect(suspensionRepo.create).not.toHaveBeenCalled()
  })

  it('silently handles errors without throwing', async () => {
    eventRepo.findByChampionshipId.mockRejectedValue(new Error('DB error'))
    await expect(handler.handle(makeDomainEvent(MatchEventType.CARTAO, CardColor.AMARELO))).resolves.not.toThrow()
  })
})
