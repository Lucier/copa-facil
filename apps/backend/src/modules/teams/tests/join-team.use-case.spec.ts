import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../../../shared/errors'
import { JoinTeamUseCase } from '../application/use-cases/join-team.use-case'

const team = { id: 'team-1', name: 'Time A', inviteToken: 'tok-1' }

let teamRepo: { findByInviteToken: ReturnType<typeof vi.fn> }
let playerRepo: { create: ReturnType<typeof vi.fn> }
let useCase: JoinTeamUseCase

beforeEach(() => {
  teamRepo = { findByInviteToken: vi.fn() }
  playerRepo = { create: vi.fn() }
  useCase = new JoinTeamUseCase(teamRepo as never, playerRepo as never)
})

describe('JoinTeamUseCase', () => {
  it('resolves team by invite token', async () => {
    teamRepo.findByInviteToken.mockResolvedValue(team)
    expect(await useCase.getTeamByToken('tok-1')).toBe(team)
  })

  it('404 for unknown invite token', async () => {
    teamRepo.findByInviteToken.mockResolvedValue(null)
    await expect(useCase.getTeamByToken('x')).rejects.toThrow(NotFoundError)
    await expect(useCase.execute('x', { fullName: 'João', mainPosition: 'atacante' } as never)).rejects.toThrow(
      NotFoundError,
    )
  })

  it('registers the player on the team, parsing the birthdate', async () => {
    teamRepo.findByInviteToken.mockResolvedValue(team)
    playerRepo.create.mockImplementation((data) => Promise.resolve({ id: 'p-1', ...data }))

    const result = await useCase.execute('tok-1', {
      fullName: 'João Silva',
      birthdate: '2000-05-10',
      mainPosition: 'atacante',
      jerseyNumber: 9,
    } as never)

    expect(playerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-1',
        fullName: 'João Silva',
        birthdate: new Date('2000-05-10'),
        jerseyNumber: 9,
      }),
    )
    expect(result.team).toBe(team)
    expect(result.player.id).toBe('p-1')
  })

  it('passes null birthdate when omitted', async () => {
    teamRepo.findByInviteToken.mockResolvedValue(team)
    playerRepo.create.mockResolvedValue({ id: 'p-1' })
    await useCase.execute('tok-1', { fullName: 'João', mainPosition: 'goleiro' } as never)
    expect(playerRepo.create).toHaveBeenCalledWith(expect.objectContaining({ birthdate: null }))
  })
})
