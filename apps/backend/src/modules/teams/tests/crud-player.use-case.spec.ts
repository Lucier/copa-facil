import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { ListPlayersUseCase } from '../application/use-cases/list-players.use-case'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { GetPlayerUseCase } from '../application/use-cases/get-player.use-case'
import { UpdatePlayerUseCase } from '../application/use-cases/update-player.use-case'
import { DeletePlayerUseCase } from '../application/use-cases/delete-player.use-case'
import { GetPlayerHistoryUseCase } from '../application/use-cases/get-player-history.use-case'
import { PLAYER_REPOSITORY } from '../domain/repositories/i-player.repository'
import { NotFoundError } from '../../../shared/errors'

const PLAYER = { id: 'p1', teamId: 't1', fullName: 'João Silva', jerseyNumber: 9 }
const HISTORY = [{ id: 'h1', playerId: 'p1', fromTeamId: 't0', toTeamId: 't1', season: '2025' }]

function buildRepo() {
  return {
    findByTeamId: vi.fn().mockResolvedValue([PLAYER]),
    findById: vi.fn().mockResolvedValue(PLAYER),
    update: vi.fn().mockResolvedValue({ ...PLAYER, fullName: 'Atualizado' }),
    delete: vi.fn().mockResolvedValue(undefined),
    findHistoryByPlayerId: vi.fn().mockResolvedValue(HISTORY),
  }
}

describe('ListPlayersUseCase', () => {
  it('returns players of a team', async () => {
    const repo = buildRepo()
    const teamRepo = { findById: vi.fn().mockResolvedValue({ id: 't1' }) }
    const mod = await Test.createTestingModule({
      providers: [
        ListPlayersUseCase,
        { provide: PLAYER_REPOSITORY, useValue: repo },
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
      ],
    }).compile()
    const result = await mod.get(ListPlayersUseCase).execute('t1')
    expect(repo.findByTeamId).toHaveBeenCalledWith('t1')
    expect(result).toHaveLength(1)
  })

  it('throws NotFoundError when team does not exist', async () => {
    const repo = buildRepo()
    const teamRepo = { findById: vi.fn().mockResolvedValue(null) }
    const mod = await Test.createTestingModule({
      providers: [
        ListPlayersUseCase,
        { provide: PLAYER_REPOSITORY, useValue: repo },
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
      ],
    }).compile()
    await expect(mod.get(ListPlayersUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })
})

describe('GetPlayerUseCase', () => {
  it('returns player by id', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [GetPlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(GetPlayerUseCase).execute('p1')
    expect(result.id).toBe('p1')
  })

  it('throws NotFoundError when player not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [GetPlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(GetPlayerUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdatePlayerUseCase', () => {
  it('updates player when found', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [UpdatePlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(UpdatePlayerUseCase).execute('p1', { fullName: 'Atualizado' })
    expect(repo.update).toHaveBeenCalledOnce()
    expect(result.fullName).toBe('Atualizado')
  })

  it('throws NotFoundError when player not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [UpdatePlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(UpdatePlayerUseCase).execute('x', {})).rejects.toThrow(NotFoundError)
  })

  it('converts birthdate string to Date object', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [UpdatePlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    await mod.get(UpdatePlayerUseCase).execute('p1', { birthdate: '2000-05-15' })
    expect(repo.update).toHaveBeenCalledWith('p1', expect.objectContaining({ birthdate: expect.any(Date) }))
  })
})

describe('DeletePlayerUseCase', () => {
  it('deletes player when found', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [DeletePlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    await mod.get(DeletePlayerUseCase).execute('p1')
    expect(repo.delete).toHaveBeenCalledWith('p1')
  })

  it('throws NotFoundError when player not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [DeletePlayerUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(DeletePlayerUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})

describe('GetPlayerHistoryUseCase', () => {
  it('returns player transfer history', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [GetPlayerHistoryUseCase, { provide: PLAYER_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(GetPlayerHistoryUseCase).execute('p1')
    expect(repo.findHistoryByPlayerId).toHaveBeenCalledWith('p1')
    expect(result).toHaveLength(1)
  })
})
