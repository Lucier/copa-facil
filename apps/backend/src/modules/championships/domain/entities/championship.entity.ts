import { BaseEntity } from '../../../../shared/domain/base-entity'
import { ChampionshipStatus, TournamentFormat } from '../enums'

export class ChampionshipEntity extends BaseEntity {
  constructor(
    id: string,
    public readonly name: string,
    public readonly season: string,
    public readonly format: TournamentFormat,
    public readonly legs: number,
    public readonly status: ChampionshipStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt)
  }

  isDraft(): boolean {
    return this.status === ChampionshipStatus.DRAFT
  }
}
