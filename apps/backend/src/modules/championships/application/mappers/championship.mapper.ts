import { championships } from '../../../../database/schemas/tenant.schema'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'
import { ChampionshipStatus, TournamentFormat } from '../../domain/enums'

type ChampionshipRow = typeof championships.$inferSelect

export class ChampionshipMapper {
  static toDomain(row: ChampionshipRow): ChampionshipEntity {
    return new ChampionshipEntity(
      row.id,
      row.name,
      row.season,
      row.format as TournamentFormat,
      row.legs,
      row.status as ChampionshipStatus,
      row.createdAt,
      row.updatedAt,
    )
  }
}
