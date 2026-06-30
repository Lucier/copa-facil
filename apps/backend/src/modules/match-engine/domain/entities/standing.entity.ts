export class StandingEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly groupId: string | null,
    public readonly teamId: string,
    public readonly matchesPlayed: number,
    public readonly wins: number,
    public readonly draws: number,
    public readonly losses: number,
    public readonly goalsFor: number,
    public readonly goalsAgainst: number,
    public readonly goalDifference: number,
    public readonly points: number,
    public readonly yellowCards: number,
    public readonly redCards: number,
    public readonly fairPlayPoints: number,
    public readonly extraPoints: number,
    public readonly updatedAt: Date,
  ) {}
}
