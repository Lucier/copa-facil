import { RoundPhase } from '../enums'

export class RoundEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly number: number,
    public readonly name: string,
    public readonly phase: RoundPhase,
    public readonly groupId: string | null,
    public readonly createdAt: Date,
  ) {}
}
