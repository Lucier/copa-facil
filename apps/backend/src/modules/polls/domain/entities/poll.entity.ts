import { PollStatus } from '../enums'

export class PollOptionEntity {
  constructor(
    public readonly id: string,
    public readonly pollId: string,
    public readonly text: string,
    public readonly votesCount: number,
    public readonly createdAt: Date,
  ) {}
}

export class PollEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly question: string,
    public readonly status: PollStatus,
    public readonly createdAt: Date,
    public readonly closedAt: Date | null,
  ) {}

  isActive(): boolean { return this.status === PollStatus.ACTIVE }
  isClosed(): boolean { return this.status === PollStatus.CLOSED }
}
