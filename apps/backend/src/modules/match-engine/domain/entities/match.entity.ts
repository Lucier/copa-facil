import { MatchStatus } from '../../../championships/domain/enums'

export class MatchEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly roundId: string,
    public readonly homeTeamId: string | null,
    public readonly awayTeamId: string | null,
    public readonly groupId: string | null,
    public readonly bracketSlot: number | null,
    public readonly status: MatchStatus,
    public readonly homeScore: number,
    public readonly awayScore: number,
    public readonly scheduledAt: Date | null,
    public readonly startedAt: Date | null,
    public readonly endedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  winner(): string | null {
    if (this.status !== MatchStatus.FINISHED) return null
    if (this.homeScore > this.awayScore) return this.homeTeamId
    if (this.awayScore > this.homeScore) return this.awayTeamId
    return null
  }

  isDraw(): boolean {
    return this.status === MatchStatus.FINISHED && this.homeScore === this.awayScore
  }
}
