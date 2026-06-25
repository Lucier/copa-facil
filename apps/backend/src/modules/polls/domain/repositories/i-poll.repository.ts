import { PollEntity, PollOptionEntity } from '../entities/poll.entity'
import { PollStatus } from '../enums'

export interface CreatePollData {
  championshipId: string
  question: string
  options: string[]
}

export interface IPollRepository {
  create(data: CreatePollData): Promise<{ poll: PollEntity; options: PollOptionEntity[] }>
  findById(id: string): Promise<PollEntity | null>
  findByChampionshipId(championshipId: string): Promise<PollEntity[]>
  findOptionsByPollId(pollId: string): Promise<PollOptionEntity[]>
  updateStatus(id: string, status: PollStatus, closedAt?: Date): Promise<PollEntity>
  vote(pollId: string, optionId: string, userId: string): Promise<void>
  getUserVote(pollId: string, userId: string): Promise<string | null>
}

export const POLL_REPOSITORY = 'POLL_REPOSITORY'
