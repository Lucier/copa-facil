import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { OpenSumulaUseCase } from '../application/use-cases/open-sumula.use-case'
import { MATCH_REPOSITORY } from '../../match-engine/domain/repositories/i-match.repository'
import { SUMULA_REPOSITORY } from '../domain/repositories/i-sumula.repository'
import { MatchEntity } from '../../match-engine/domain/entities/match.entity'
import { SumulaEntity } from '../domain/entities/sumula.entity'
import { SumulaStatus } from '../domain/enums'
import { MatchStatus } from '../../championships/domain/enums'
import { NotFoundError } from '../../../shared/errors'

const MOCK_MATCH = new MatchEntity('m1', 'c1', 'r1', 'h', 'a', null, null, MatchStatus.SCHEDULED, 0, 0, null, null, null, new Date())
const MOCK_SUMULA = new SumulaEntity('s1', 'm1', 'c1', 'Estádio X', null, SumulaStatus.ABERTA, null, null, null, new Date(), new Date())

describe('OpenSumulaUseCase', () => {
  let useCase: OpenSumulaUseCase
  let matchRepo: { findById: ReturnType<typeof vi.fn> }
  let sumulaRepo: { findByMatchId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    matchRepo = { findById: vi.fn().mockResolvedValue(MOCK_MATCH) }
    sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(MOCK_SUMULA) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenSumulaUseCase,
        { provide: MATCH_REPOSITORY, useValue: matchRepo },
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
      ],
    }).compile()

    useCase = module.get<OpenSumulaUseCase>(OpenSumulaUseCase)
  })

  it('opens sumula for a valid match', async () => {
    const result = await useCase.execute('m1', { venue: 'Estádio X' })
    expect(result.status).toBe(SumulaStatus.ABERTA)
    expect(sumulaRepo.create).toHaveBeenCalledWith({ matchId: 'm1', championshipId: 'c1', venue: 'Estádio X' })
  })

  it('throws NotFoundError when match does not exist', async () => {
    matchRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { venue: 'x' })).rejects.toThrow(NotFoundError)
  })

  it('throws CONFLICT AppError when sumula already exists for the match', async () => {
    sumulaRepo.findByMatchId.mockResolvedValue(MOCK_SUMULA)
    const err = await useCase.execute('m1', { venue: 'x' }).catch((e) => e)
    expect((err as any).code).toBe('CONFLICT')
  })
})
