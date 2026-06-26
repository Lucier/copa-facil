import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { StartMatchUseCase } from '../application/use-cases/start-match.use-case'
import { MATCH_REPOSITORY } from '../domain/repositories/i-match.repository'
import { MatchEntity } from '../domain/entities/match.entity'
import { MatchStatus } from '../../championships/domain/enums'
import { NotFoundError, AppError } from '../../../shared/errors'

function makeMatch(status: MatchStatus): MatchEntity {
  return new MatchEntity('m1', 'c1', 'r1', 'home', 'away', null, null, status, 0, 0, null, null, null, new Date())
}

describe('StartMatchUseCase', () => {
  let useCase: StartMatchUseCase
  let repo: { findById: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    repo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartMatchUseCase,
        { provide: MATCH_REPOSITORY, useValue: repo },
      ],
    }).compile()

    useCase = module.get<StartMatchUseCase>(StartMatchUseCase)
  })

  it('transitions match from SCHEDULED to LIVE', async () => {
    const scheduled = makeMatch(MatchStatus.SCHEDULED)
    const live = makeMatch(MatchStatus.LIVE)
    repo.findById.mockResolvedValue(scheduled)
    repo.updateStatus.mockResolvedValue(live)

    const result = await useCase.execute('m1')
    expect(repo.updateStatus).toHaveBeenCalledWith('m1', MatchStatus.LIVE, expect.objectContaining({ startedAt: expect.any(Date) }))
    expect(result.status).toBe(MatchStatus.LIVE)
  })

  it('throws NotFoundError when match does not exist', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown')).rejects.toThrow(NotFoundError)
  })

  it('throws AppError INVALID_STATE when match is already LIVE', async () => {
    repo.findById.mockResolvedValue(makeMatch(MatchStatus.LIVE))
    const err = await useCase.execute('m1').catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as any).code).toBe('INVALID_STATE')
  })

  it('throws AppError INVALID_STATE when match is already FINISHED', async () => {
    repo.findById.mockResolvedValue(makeMatch(MatchStatus.FINISHED))
    const err = await useCase.execute('m1').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
