import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { CloseSumulaUseCase } from '../application/use-cases/close-sumula.use-case'
import { MATCH_REPOSITORY } from '../../match-engine/domain/repositories/i-match.repository'
import { SUMULA_REPOSITORY } from '../domain/repositories/i-sumula.repository'
import { LINEUP_REPOSITORY } from '../domain/repositories/i-lineup.repository'
import { OFFICIAL_REPOSITORY } from '../domain/repositories/i-official.repository'
import { MATCH_EVENT_REPOSITORY } from '../../match-engine/domain/repositories/i-match-event.repository'
import { MatchEntity } from '../../match-engine/domain/entities/match.entity'
import { SumulaEntity } from '../domain/entities/sumula.entity'
import { SumulaStatus } from '../domain/enums'
import { MatchStatus } from '../../championships/domain/enums'
import { NotFoundError } from '../../../shared/errors'

function makeMatch(status = MatchStatus.FINISHED): MatchEntity {
  return new MatchEntity('m1', 'c1', 'r1', 'h', 'a', null, null, status, 2, 1, null, null, null, new Date())
}

function makeSumula(status = SumulaStatus.ABERTA): SumulaEntity {
  return new SumulaEntity('s1', 'm1', 'c1', 'Estádio', 'obs', status, null, null, null, new Date(), new Date())
}

describe('CloseSumulaUseCase', () => {
  let useCase: CloseSumulaUseCase
  let matchRepo: { findById: ReturnType<typeof vi.fn> }
  let sumulaRepo: { findByMatchId: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  let lineupRepo: { findByMatchId: ReturnType<typeof vi.fn> }
  let officialRepo: { findByMatchId: ReturnType<typeof vi.fn> }
  let eventRepo: { findByMatchId: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    matchRepo = { findById: vi.fn().mockResolvedValue(makeMatch()) }
    sumulaRepo = {
      findByMatchId: vi.fn().mockResolvedValue(makeSumula()),
      update: vi.fn().mockImplementation((_, data) =>
        Promise.resolve({ ...makeSumula(SumulaStatus.FECHADA), ...data }),
      ),
    }
    lineupRepo = { findByMatchId: vi.fn().mockResolvedValue([{ playerId: 'p1', teamId: 'h', isStarter: true }]) }
    officialRepo = { findByMatchId: vi.fn().mockResolvedValue([{ name: 'Árbitro Fulano', role: 'arbitro_principal' }]) }
    eventRepo = { findByMatchId: vi.fn().mockResolvedValue([{ eventType: 'GOL', minute: 10, teamId: 'h' }]) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloseSumulaUseCase,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: lineupRepo },
        { provide: OFFICIAL_REPOSITORY, useValue: officialRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
      ],
    }).compile()

    useCase = module.get<CloseSumulaUseCase>(CloseSumulaUseCase)
  })

  it('closes sumula and generates SHA-256 integrity hash', async () => {
    const result = await useCase.execute('m1', 'uid-arbitro')
    expect(result.status).toBe(SumulaStatus.FECHADA)
    const updateArg = sumulaRepo.update.mock.calls[0][1]
    expect(updateArg.integrityHash).toBeTruthy()
    expect(updateArg.integrityHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('integrity hash changes when match data differs', async () => {
    await useCase.execute('m1', 'uid-arbitro')
    const hash1 = sumulaRepo.update.mock.calls[0][1].integrityHash

    // Change the lineup between calls
    lineupRepo.findByMatchId.mockResolvedValue([{ playerId: 'p2', teamId: 'a', isStarter: false }])
    sumulaRepo.update.mockClear()
    await useCase.execute('m1', 'uid-arbitro')
    const hash2 = sumulaRepo.update.mock.calls[0][1].integrityHash

    expect(hash1).not.toBe(hash2)
  })

  it('sets closedAt and closedBy correctly', async () => {
    await useCase.execute('m1', 'uid-arbitro')
    const updateArg = sumulaRepo.update.mock.calls[0][1]
    expect(updateArg.closedBy).toBe('uid-arbitro')
    expect(updateArg.closedAt).toBeInstanceOf(Date)
    expect(updateArg.status).toBe(SumulaStatus.FECHADA)
  })

  it('throws NotFoundError when match does not exist', async () => {
    matchRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('m1', 'uid')).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when match is not FINISHED', async () => {
    matchRepo.findById.mockResolvedValue(makeMatch(MatchStatus.LIVE))
    const err = await useCase.execute('m1', 'uid').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
    expect(err.message).toMatch(/finished/i)
  })

  it('throws NotFoundError when sumula does not exist', async () => {
    sumulaRepo.findByMatchId.mockResolvedValue(null)
    await expect(useCase.execute('m1', 'uid')).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when sumula is already closed', async () => {
    sumulaRepo.findByMatchId.mockResolvedValue(makeSumula(SumulaStatus.FECHADA))
    const err = await useCase.execute('m1', 'uid').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
