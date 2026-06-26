import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { RegisterPlayerUseCase } from '../application/use-cases/register-player.use-case'
import { PLAYER_REPOSITORY } from '../domain/repositories/i-player.repository'
import { TEAM_REPOSITORY } from '../domain/repositories/i-team.repository'
import { NotFoundError } from '../../../shared/errors'

const TEAM = { id: 'team-1', name: 'Time A' }
const PLAYER = { id: 'p1', teamId: 'team-1', fullName: 'Carlos Santos', jerseyNumber: 9 }

describe('RegisterPlayerUseCase', () => {
  let useCase: RegisterPlayerUseCase
  let playerRepo: { create: ReturnType<typeof vi.fn> }
  let teamRepo: { findById: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    playerRepo = { create: vi.fn().mockResolvedValue(PLAYER) }
    teamRepo = { findById: vi.fn().mockResolvedValue(TEAM) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterPlayerUseCase,
        { provide: PLAYER_REPOSITORY, useValue: playerRepo },
        { provide: TEAM_REPOSITORY, useValue: teamRepo },
      ],
    }).compile()

    useCase = module.get<RegisterPlayerUseCase>(RegisterPlayerUseCase)
  })

  it('registers player when team exists', async () => {
    const result = await useCase.execute('team-1', { fullName: 'Carlos Santos', jerseyNumber: 9 })
    expect(playerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-1', fullName: 'Carlos Santos', jerseyNumber: 9 }))
    expect(result.id).toBe('p1')
  })

  it('throws NotFoundError when team does not exist', async () => {
    teamRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('unknown', { fullName: 'Test', jerseyNumber: 1 })).rejects.toThrow(NotFoundError)
  })

  it('passes optional fields to repository', async () => {
    await useCase.execute('team-1', {
      fullName: 'Test Player',
      jerseyNumber: 7,
      document: '123.456.789-00',
      documentType: 'cpf' as any,
      birthdate: '2000-01-01',
      mainPosition: 'MCA',
    })
    expect(playerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        document: '123.456.789-00',
        mainPosition: 'MCA',
        birthdate: expect.any(Date),
      }),
    )
  })

  it('passes null birthdate when not provided', async () => {
    await useCase.execute('team-1', { fullName: 'No Birthday', jerseyNumber: 5 })
    expect(playerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ birthdate: null }),
    )
  })
})
