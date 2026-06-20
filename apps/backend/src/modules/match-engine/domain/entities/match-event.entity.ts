import { CardColor, GoalType, MatchEventType } from '../enums'

export class MatchEventEntity {
  constructor(
    public readonly id: string,
    public readonly matchId: string,
    public readonly championshipId: string,
    public readonly eventType: MatchEventType,
    public readonly teamId: string,
    public readonly playerId: string | null,
    public readonly assistPlayerId: string | null,
    public readonly playerOutId: string | null,
    public readonly playerInId: string | null,
    public readonly minute: number,
    public readonly goalType: GoalType | null,
    public readonly cardColor: CardColor | null,
    public readonly createdAt: Date,
  ) {}
}
