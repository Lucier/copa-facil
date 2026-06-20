import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchEventEntity } from '../../domain/entities/match-event.entity'
import { CardColor, GoalType, MatchEventType } from '../../domain/enums'
import {
  CreateMatchEventData,
  IMatchEventRepository,
} from '../../domain/repositories/i-match-event.repository'

interface MatchEventRow {
  id: string
  match_id: string
  championship_id: string
  event_type: string
  team_id: string
  player_id: string | null
  assist_player_id: string | null
  player_out_id: string | null
  player_in_id: string | null
  minute: number
  goal_type: string | null
  card_color: string | null
  created_at: Date
}

function toEntity(row: MatchEventRow): MatchEventEntity {
  return new MatchEventEntity(
    row.id,
    row.match_id,
    row.championship_id,
    row.event_type as MatchEventType,
    row.team_id,
    row.player_id,
    row.assist_player_id,
    row.player_out_id,
    row.player_in_id,
    row.minute,
    row.goal_type as GoalType | null,
    row.card_color as CardColor | null,
    row.created_at,
  )
}

@Injectable()
export class DrizzleMatchEventRepository implements IMatchEventRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByMatchId(matchId: string): Promise<MatchEventEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchEventRow[]>`
        SELECT id, match_id, championship_id, event_type, team_id, player_id,
               assist_player_id, player_out_id, player_in_id, minute,
               goal_type, card_color, created_at
        FROM match_events
        WHERE match_id = ${matchId}
        ORDER BY minute ASC, created_at ASC
      `
    })
    return rows.map(toEntity)
  }

  async findByChampionshipId(championshipId: string): Promise<MatchEventEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchEventRow[]>`
        SELECT id, match_id, championship_id, event_type, team_id, player_id,
               assist_player_id, player_out_id, player_in_id, minute,
               goal_type, card_color, created_at
        FROM match_events
        WHERE championship_id = ${championshipId}
        ORDER BY created_at ASC
      `
    })
    return rows.map(toEntity)
  }

  async create(data: CreateMatchEventData): Promise<MatchEventEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<MatchEventRow[]>`
        INSERT INTO match_events (
          match_id, championship_id, event_type, team_id, player_id,
          assist_player_id, player_out_id, player_in_id, minute, goal_type, card_color
        )
        VALUES (
          ${data.matchId},
          ${data.championshipId},
          ${data.eventType},
          ${data.teamId},
          ${data.playerId ?? null},
          ${data.assistPlayerId ?? null},
          ${data.playerOutId ?? null},
          ${data.playerInId ?? null},
          ${data.minute},
          ${data.goalType ?? null},
          ${data.cardColor ?? null}
        )
        RETURNING id, match_id, championship_id, event_type, team_id, player_id,
                  assist_player_id, player_out_id, player_in_id, minute,
                  goal_type, card_color, created_at
      `
    })
    return toEntity(rows[0])
  }
}
