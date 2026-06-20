export class PlayerStatisticEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly teamId: string,
    public readonly playerId: string,
    public readonly goals: number,
    public readonly assists: number,
    public readonly yellowCards: number,
    public readonly redCards: number,
    public readonly updatedAt: Date,
  ) {}
}
