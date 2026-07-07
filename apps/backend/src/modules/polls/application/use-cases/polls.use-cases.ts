import { Inject, Injectable } from '@nestjs/common'
import { IsArray, IsString, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AppError, NotFoundError } from '../../../../shared/errors'
import { PollStatus } from '../../domain/enums'
import { PollEntity, PollOptionEntity } from '../../domain/entities/poll.entity'
import { IPollRepository} from '../../domain/repositories/i-poll.repository'
import { POLL_REPOSITORY } from '../../domain/repositories/i-poll.repository'

/* ─── DTOs ─── */

export class CreatePollDto {
  @ApiProperty() @IsString() question!: string
  @ApiProperty({ type: [String] })
  @IsArray() @IsString({ each: true }) @ArrayMinSize(2) @ArrayMaxSize(10)
  options!: string[]
}

export class VotePollDto {
  @ApiProperty() @IsUUID() optionId!: string
}

/* ─── Result shape ─── */

export interface PollResultsDto {
  id: string
  championshipId: string
  question: string
  status: string
  totalVotes: number
  options: { id: string; text: string; votesCount: number; percentage: number }[]
  userVotedOptionId: string | null
  createdAt: string
  closedAt: string | null
}

function buildResults(
  poll: PollEntity,
  options: PollOptionEntity[],
  userVotedOptionId: string | null,
): PollResultsDto {
  const totalVotes = options.reduce((s, o) => s + o.votesCount, 0)
  return {
    id: poll.id,
    championshipId: poll.championshipId,
    question: poll.question,
    status: poll.status,
    totalVotes,
    options: options.map((o) => ({
      id: o.id,
      text: o.text,
      votesCount: o.votesCount,
      percentage: totalVotes > 0 ? Math.round((o.votesCount / totalVotes) * 100) : 0,
    })),
    userVotedOptionId,
    createdAt: new Date(poll.createdAt).toISOString(),
    closedAt: poll.closedAt ? new Date(poll.closedAt).toISOString() : null,
  }
}

/* ─── Use Cases ─── */

@Injectable()
export class CreatePollUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  execute(championshipId: string, dto: CreatePollDto) {
    return this.repo.create({ championshipId, question: dto.question, options: dto.options })
  }
}

@Injectable()
export class ListPollsUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  async execute(championshipId: string, userId: string): Promise<PollResultsDto[]> {
    const polls = await this.repo.findByChampionshipId(championshipId)
    return Promise.all(
      polls.map(async (poll) => {
        const options = await this.repo.findOptionsByPollId(poll.id)
        const userVotedOptionId = await this.repo.getUserVote(poll.id, userId)
        return buildResults(poll, options, userVotedOptionId)
      }),
    )
  }
}

@Injectable()
export class GetPollResultsUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  async execute(pollId: string, userId: string): Promise<PollResultsDto> {
    const poll = await this.repo.findById(pollId)
    if (!poll) throw new NotFoundError('Poll', pollId)
    const options = await this.repo.findOptionsByPollId(pollId)
    const userVotedOptionId = await this.repo.getUserVote(pollId, userId)
    return buildResults(poll, options, userVotedOptionId)
  }
}

@Injectable()
export class PublishPollUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  async execute(pollId: string): Promise<PollEntity> {
    const poll = await this.repo.findById(pollId)
    if (!poll) throw new NotFoundError('Poll', pollId)
    if (poll.status !== PollStatus.DRAFT)
      throw new AppError('Only draft polls can be published', 'INVALID_STATE', 422)
    return this.repo.updateStatus(pollId, PollStatus.ACTIVE)
  }
}

@Injectable()
export class ClosePollUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  async execute(pollId: string): Promise<PollEntity> {
    const poll = await this.repo.findById(pollId)
    if (!poll) throw new NotFoundError('Poll', pollId)
    if (poll.status !== PollStatus.ACTIVE)
      throw new AppError('Only active polls can be closed', 'INVALID_STATE', 422)
    return this.repo.updateStatus(pollId, PollStatus.CLOSED, new Date())
  }
}

@Injectable()
export class VotePollUseCase {
  constructor(@Inject(POLL_REPOSITORY) private readonly repo: IPollRepository) {}
  async execute(pollId: string, dto: VotePollDto, userId: string): Promise<void> {
    const poll = await this.repo.findById(pollId)
    if (!poll) throw new NotFoundError('Poll', pollId)
    if (!poll.isActive()) throw new AppError('Poll is not accepting votes', 'INVALID_STATE', 422)
    const options = await this.repo.findOptionsByPollId(pollId)
    if (!options.find((o) => o.id === dto.optionId))
      throw new AppError('Invalid option for this poll', 'NOT_FOUND', 404)
    await this.repo.vote(pollId, dto.optionId, userId)
  }
}
