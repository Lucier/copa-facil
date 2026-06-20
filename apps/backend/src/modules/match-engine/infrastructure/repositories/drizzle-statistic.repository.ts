import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PlayerStatisticEntity } from '../../domain/entities/player-statistic.entity'
import {
  IStatisticRepository,
  UpsertPlayerStatisticData,
} from '../../domain/repositories/i-statistic.repository'

interface StatRow {
  id: string
  championship_id: string
  team_id: string
  player_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  updated_at: Date
}

function toEntity(row: StatRow): PlayerStatisticEntity {
  return new PlayerStatisticEntity(
    row.id,
    row.championship_id,
    row.team_id,
    row.player_id,
    row.goals,
    row.assists,
    row.yellow_cards,
    row.red_cards,
    row.updated_at,
  )
}

@Injectable()
export class DrizzleStatisticRepository implements IStatisticRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByChampionshipId(championshipId: string): Promise<PlayerStatisticEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StatRow[]>`
        SELECT id, championship_id, team_id, player_id, goals, assists,
               yellow_cards, red_cards, updated_at
        FROM player_statistics
        WHERE championship_id = ${championshipId}
        ORDER BY goals DESC, assists DESC
      `
    })
    return rows.map(toEntity)
  }

  async upsert(data: UpsertPlayerStatisticData): Promise<PlayerStatisticEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StatRow[]>`
        INSERT INTO player_statistics (
          championship_id, team_id, player_id, goals, assists, yellow_cards, red_cards, updated_at
        )
        VALUES (
          ${data.championshipId}, ${data.teamId}, ${data.playerId},
          ${data.goals}, ${data.assists}, ${data.yellowCards}, ${data.redCards}, NOW()
        )
        ON CONFLICT (championship_id, player_id) DO UPDATE SET
          team_id      = EXCLUDED.team_id,
          goals        = EXCLUDED.goals,
          assists      = EXCLUDED.assists,
          yellow_cards = EXCLUDED.yellow_cards,
          red_cards    = EXCLUDED.red_cards,
          updated_at   = NOW()
        RETURNING id, championship_id, team_id, player_id, goals, assists,
                  yellow_cards, red_cards, updated_at
      `
    })
    return toEntity(rows[0])
  }

  async upsertMany(data: UpsertPlayerStatisticData[]): Promise<void> {
    await Promise.all(data.map((d) => this.upsert(d)))
  }
}
