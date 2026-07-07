import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ConcludeMatchUseCase } from '../application/use-cases/conclude-match.use-case'
import { MATCH_REPOSITORY } from '../domain/repositories/i-match.repository'
import { MatchEntity } from '../domain/entities/match.entity'
import { MatchStatus } from '../../championships/domain/enums'
import { MatchConcludedDomainEvent } from '../domain/events/match-concluded.event'
import { NotFoundError } from '../../../shared/errors'

function makeMatch(status = MatchStatus.LIVE): MatchEntity {
  return new MatchEntity('m1', 'c1', 'r1', 'home', 'away', null, null, status, 0, 0, null, null, null, new Date())
}

describe('ConcludeMatchUseCase', () => {
  let useCase: ConcludeMatchUseCase
  let repo: { findById: ReturnType<typeof vi.fn>; updateScore: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }
  let emitter: { emit: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findById: vi.fn().mockResolvedValue(makeMatch()),
      updateScore: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(makeMatch(MatchStatus.FINISHED)),
    }
    emitter = { emit: vi.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcludeMatchUseCase,
        { provide: MATCH_REPOSITORY, useValue: repo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile()

    useCase = module.get<ConcludeMatchUseCase>(ConcludeMatchUseCase)
  })

  it('updates score and transitions match to FINISHED', async () => {
    await useCase.execute('m1', { homeScore: 2, awayScore: 1 })
    expect(repo.updateScore).toHaveBeenCalledWith('m1', 2, 1)
    expect(repo.updateStatus).toHaveBeenCalledWith('m1', MatchStatus.FINISHED, expect.objectContaining({ endedAt: expect.any(Date) }))
  })

  it('emits MatchConcludedDomainEvent', async () => {
    await useCase.execute('m1', { homeScore: 0, awayScore: 0 })
    expect(emitter.emit).toHaveBeenCalledOnce()
    expect(emitter.emit.mock.calls[0][0]).toBe(MatchConcludedDomainEvent.EVENT_NAME)
  })

  it('throws NotFoundError when match does not exist', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { homeScore: 0, awayScore: 0 })).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when match is not LIVE', async () => {
    repo.findById.mockResolvedValue(makeMatch(MatchStatus.SCHEDULED))
    const err = await useCase.execute('m1', { homeScore: 0, awayScore: 0 }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })

  it('throws INVALID_STATE when match is already FINISHED', async () => {
    repo.findById.mockResolvedValue(makeMatch(MatchStatus.FINISHED))
    const err = await useCase.execute('m1', { homeScore: 1, awayScore: 1 }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
