import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AddPlayerToLineupUseCase } from '../application/use-cases/add-player-to-lineup.use-case'
import { SUMULA_REPOSITORY } from '../domain/repositories/i-sumula.repository'
import { LINEUP_REPOSITORY } from '../domain/repositories/i-lineup.repository'
import { SumulaEntity } from '../domain/entities/sumula.entity'
import { MatchLineupEntity } from '../domain/entities/match-lineup.entity'
import { SumulaStatus } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const OPEN_SUMULA = new SumulaEntity('s1', 'm1', 'c1', null, null, SumulaStatus.ABERTA, null, null, null, new Date(), new Date())
const CLOSED_SUMULA = new SumulaEntity('s1', 'm1', 'c1', null, null, SumulaStatus.FECHADA, new Date(), 'uid', 'hash', new Date(), new Date())
const MOCK_LINEUP = new MatchLineupEntity('l1', 'm1', 'team-A', 'p1', 10, 'ATA', true, false, new Date())

describe('AddPlayerToLineupUseCase', () => {
  let useCase: AddPlayerToLineupUseCase
  let sumulaRepo: { findByMatchId: ReturnType<typeof vi.fn> }
  let lineupRepo: { findByMatchAndPlayer: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(OPEN_SUMULA) }
    lineupRepo = {
      findByMatchAndPlayer: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(MOCK_LINEUP),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddPlayerToLineupUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: lineupRepo },
      ],
    }).compile()

    useCase = module.get<AddPlayerToLineupUseCase>(AddPlayerToLineupUseCase)
  })

  it('adds player to lineup successfully', async () => {
    const result = await useCase.execute('m1', { playerId: 'p1', teamId: 'team-A', jerseyNumber: 10, position: 'ATA', isStarter: true, isCaptain: false })
    expect(result.playerId).toBe('p1')
    expect(lineupRepo.create).toHaveBeenCalledOnce()
  })

  it('throws NotFoundError when sumula does not exist', async () => {
    sumulaRepo.findByMatchId.mockResolvedValue(null)
    await expect(useCase.execute('m1', { playerId: 'p1', teamId: 'team-A', jerseyNumber: 10, position: 'ATA' })).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when sumula is closed', async () => {
    sumulaRepo.findByMatchId.mockResolvedValue(CLOSED_SUMULA)
    const err = await useCase.execute('m1', { playerId: 'p1', teamId: 'team-A', jerseyNumber: 10, position: 'ATA' }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })

  it('throws CONFLICT when player is already in lineup', async () => {
    lineupRepo.findByMatchAndPlayer.mockResolvedValue(MOCK_LINEUP)
    const err = await useCase.execute('m1', { playerId: 'p1', teamId: 'team-A', jerseyNumber: 10, position: 'ATA' }).catch((e) => e)
    expect((err as any).code).toBe('CONFLICT')
  })

  it('defaults isStarter to true and isCaptain to false when not provided', async () => {
    await useCase.execute('m1', { playerId: 'p1', teamId: 'team-A', jerseyNumber: 10, position: 'ATA' })
    expect(lineupRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isStarter: true, isCaptain: false }),
    )
  })
})
