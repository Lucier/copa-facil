import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, NotFoundError } from '../../../shared/errors'
import {
  ClosePollUseCase,
  CreatePollUseCase,
  GetPollResultsUseCase,
  ListPollsUseCase,
  PublishPollUseCase,
  VotePollUseCase,
} from '../application/use-cases/polls.use-cases'
import { PollEntity, PollOptionEntity } from '../domain/entities/poll.entity'
import { PollStatus } from '../domain/enums'

function makePoll(status = PollStatus.ACTIVE, closedAt: Date | null = null): PollEntity {
  return new PollEntity('poll-1', 'champ-1', 'Melhor jogador?', status, new Date('2026-07-01'), closedAt)
}

function makeOptions(votes: [number, number] = [3, 1]): PollOptionEntity[] {
  return [
    new PollOptionEntity('opt-1', 'poll-1', 'Jogador A', votes[0], new Date()),
    new PollOptionEntity('opt-2', 'poll-1', 'Jogador B', votes[1], new Date()),
  ]
}

let repo: {
  create: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
  findByChampionshipId: ReturnType<typeof vi.fn>
  findOptionsByPollId: ReturnType<typeof vi.fn>
  updateStatus: ReturnType<typeof vi.fn>
  vote: ReturnType<typeof vi.fn>
  getUserVote: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  repo = {
    create: vi.fn(),
    findById: vi.fn(),
    findByChampionshipId: vi.fn(),
    findOptionsByPollId: vi.fn(),
    updateStatus: vi.fn(),
    vote: vi.fn(),
    getUserVote: vi.fn(),
  }
})

describe('CreatePollUseCase', () => {
  it('creates a poll with options', async () => {
    repo.create.mockResolvedValue({ poll: makePoll(PollStatus.DRAFT), options: makeOptions([0, 0]) })
    await new CreatePollUseCase(repo as never).execute('champ-1', {
      question: 'Melhor jogador?',
      options: ['Jogador A', 'Jogador B'],
    })
    expect(repo.create).toHaveBeenCalledWith({
      championshipId: 'champ-1',
      question: 'Melhor jogador?',
      options: ['Jogador A', 'Jogador B'],
    })
  })
})

describe('GetPollResultsUseCase', () => {
  it('computes totals, percentages and user vote', async () => {
    repo.findById.mockResolvedValue(makePoll())
    repo.findOptionsByPollId.mockResolvedValue(makeOptions([3, 1]))
    repo.getUserVote.mockResolvedValue('opt-1')

    const result = await new GetPollResultsUseCase(repo as never).execute('poll-1', 'user-1')
    expect(result.totalVotes).toBe(4)
    expect(result.options[0].percentage).toBe(75)
    expect(result.options[1].percentage).toBe(25)
    expect(result.userVotedOptionId).toBe('opt-1')
  })

  it('returns 0% for polls without votes', async () => {
    repo.findById.mockResolvedValue(makePoll())
    repo.findOptionsByPollId.mockResolvedValue(makeOptions([0, 0]))
    repo.getUserVote.mockResolvedValue(null)

    const result = await new GetPollResultsUseCase(repo as never).execute('poll-1', 'user-1')
    expect(result.totalVotes).toBe(0)
    expect(result.options.every((o) => o.percentage === 0)).toBe(true)
  })

  it('404 for unknown poll', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(new GetPollResultsUseCase(repo as never).execute('x', 'u')).rejects.toThrow(NotFoundError)
  })
})

describe('ListPollsUseCase', () => {
  it('builds results for every poll of the championship', async () => {
    repo.findByChampionshipId.mockResolvedValue([makePoll(), makePoll()])
    repo.findOptionsByPollId.mockResolvedValue(makeOptions())
    repo.getUserVote.mockResolvedValue(null)

    const result = await new ListPollsUseCase(repo as never).execute('champ-1', 'user-1')
    expect(result).toHaveLength(2)
    expect(result[0].totalVotes).toBe(4)
  })
})

describe('PublishPollUseCase', () => {
  it('publishes a draft poll', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.DRAFT))
    await new PublishPollUseCase(repo as never).execute('poll-1')
    expect(repo.updateStatus).toHaveBeenCalledWith('poll-1', PollStatus.ACTIVE)
  })

  it('rejects publishing a non-draft poll', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.ACTIVE))
    await expect(new PublishPollUseCase(repo as never).execute('poll-1')).rejects.toThrow(AppError)
  })
})

describe('ClosePollUseCase', () => {
  it('closes an active poll with a closedAt timestamp', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.ACTIVE))
    await new ClosePollUseCase(repo as never).execute('poll-1')
    expect(repo.updateStatus).toHaveBeenCalledWith('poll-1', PollStatus.CLOSED, expect.any(Date))
  })

  it('rejects closing a draft poll', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.DRAFT))
    await expect(new ClosePollUseCase(repo as never).execute('poll-1')).rejects.toThrow(AppError)
  })
})

describe('VotePollUseCase', () => {
  it('registers a vote on a valid option', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.ACTIVE))
    repo.findOptionsByPollId.mockResolvedValue(makeOptions())
    await new VotePollUseCase(repo as never).execute('poll-1', { optionId: 'opt-2' }, 'user-1')
    expect(repo.vote).toHaveBeenCalledWith('poll-1', 'opt-2', 'user-1')
  })

  it('rejects votes on inactive polls', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.CLOSED))
    await expect(
      new VotePollUseCase(repo as never).execute('poll-1', { optionId: 'opt-1' }, 'user-1'),
    ).rejects.toThrow(/not accepting votes/)
  })

  it('rejects votes on options from another poll', async () => {
    repo.findById.mockResolvedValue(makePoll(PollStatus.ACTIVE))
    repo.findOptionsByPollId.mockResolvedValue(makeOptions())
    await expect(
      new VotePollUseCase(repo as never).execute('poll-1', { optionId: 'opt-999' }, 'user-1'),
    ).rejects.toThrow(/Invalid option/)
    expect(repo.vote).not.toHaveBeenCalled()
  })
})
