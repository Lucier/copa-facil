import { MatchStatus } from '../enums'

export class MatchStubEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly roundId: string,
    public readonly homeTeamId: string | null,
    public readonly awayTeamId: string | null,
    public readonly groupId: string | null,
    public readonly bracketSlot: number | null,
    public readonly status: MatchStatus,
    public readonly createdAt: Date,
  ) {}

  isBye(): boolean {
    return this.homeTeamId !== null && this.awayTeamId === null
  }
}
