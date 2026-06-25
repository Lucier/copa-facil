import { SumulaStatus } from '../enums'

export class SumulaEntity {
  constructor(
    public readonly id: string,
    public readonly matchId: string,
    public readonly championshipId: string,
    public readonly venue: string | null,
    public readonly observations: string | null,
    public readonly status: SumulaStatus,
    public readonly closedAt: Date | null,
    public readonly closedBy: string | null,
    public readonly integrityHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isClosed(): boolean {
    return this.status === SumulaStatus.FECHADA
  }
}
