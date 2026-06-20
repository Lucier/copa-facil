export class PlayerHistoryEntity {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly championshipId: string | null,
    public readonly fromTeamId: string | null,
    public readonly toTeamId: string | null,
    public readonly goals: number,
    public readonly yellowCards: number,
    public readonly redCards: number,
    public readonly season: string | null,
    public readonly note: string | null,
    public readonly createdAt: Date,
  ) {}
}
