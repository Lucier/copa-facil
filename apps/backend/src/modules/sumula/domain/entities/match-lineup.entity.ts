export class MatchLineupEntity {
  constructor(
    public readonly id: string,
    public readonly matchId: string,
    public readonly teamId: string,
    public readonly playerId: string,
    public readonly jerseyNumber: number | null,
    public readonly position: string | null,
    public readonly isStarter: boolean,
    public readonly isCaptain: boolean,
    public readonly addedAt: Date,
  ) {}
}
