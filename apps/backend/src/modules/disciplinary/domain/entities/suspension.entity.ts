import { SuspensionSource} from '../enums'
import { SuspensionStatus } from '../enums'

export class SuspensionEntity {
  constructor(
    public readonly id: string,
    public readonly championshipId: string,
    public readonly playerId: string,
    public readonly teamId: string,
    public readonly reason: string,
    public readonly source: SuspensionSource,
    public readonly matchesToServe: number,
    public readonly matchesServed: number,
    public readonly status: SuspensionStatus,
    public readonly eventId: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isActive(): boolean {
    return this.status === SuspensionStatus.ATIVA
  }

  remainingMatches(): number {
    return Math.max(0, this.matchesToServe - this.matchesServed)
  }
}
