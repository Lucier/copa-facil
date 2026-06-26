import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { TransferPlayerUseCase } from '../application/use-cases/transfer-player.use-case'
import { PLAYER_REPOSITORY } from '../domain/repositories/i-player.repository'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { NotFoundError } from '../../../shared/errors'

const PLAYER = { id: 'p1', teamId: 'team-A', fullName: 'João Silva' }
const TARGET_TEAM = { id: 'team-B', name: 'Time B' }
const TRANSFERRED = { ...PLAYER, teamId: 'team-B' }

describe('TransferPlayerUseCase', () => {
  let useCase: TransferPlayerUseCase
  let playerRepo: {
    findById: ReturnType<typeof vi.fn>
    createHistory: ReturnType<typeof vi.fn>
    transferToTeam: ReturnType<typeof vi.fn>
  }
  let teamRepo: { findById: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    playerRepo = {
      findById: vi.fn().mockResolvedValue(PLAYER),
      createHistory: vi.fn().mockResolvedValue(undefined),
      transferToTeam: vi.fn().mockResolvedValue(TRANSFERRED),
    }
    teamRepo = { findById: vi.fn().mockResolvedValue(TARGET_TEAM) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferPlayerUseCase,
        { provide: PLAYER_REPOSITORY, useValue: playerRepo },
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
      ],
    }).compile()

    useCase = module.get<TransferPlayerUseCase>(TransferPlayerUseCase)
  })

  it('transfers player and creates player_history record', async () => {
    const result = await useCase.execute('p1', { toTeamId: 'team-B', season: '2026' })
    expect(playerRepo.createHistory).toHaveBeenCalledWith(
      expect.objectContaining({ playerId: 'p1', fromTeamId: 'team-A', toTeamId: 'team-B', season: '2026' }),
    )
    expect(playerRepo.transferToTeam).toHaveBeenCalledWith('p1', 'team-B')
    expect(result.teamId).toBe('team-B')
  })

  it('records optional note in history', async () => {
    await useCase.execute('p1', { toTeamId: 'team-B', season: '2026', note: 'Empréstimo' })
    expect(playerRepo.createHistory).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Empréstimo' }),
    )
  })

  it('throws NotFoundError when player does not exist', async () => {
    playerRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { toTeamId: 'team-B', season: '2026' })).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when target team does not exist', async () => {
    teamRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('p1', { toTeamId: 'unknown-team', season: '2026' })).rejects.toThrow(NotFoundError)
  })

  it('records fromTeamId from player current team', async () => {
    await useCase.execute('p1', { toTeamId: 'team-B', season: '2026' })
    const historyCall = playerRepo.createHistory.mock.calls[0][0]
    expect(historyCall.fromTeamId).toBe('team-A')
  })
})
