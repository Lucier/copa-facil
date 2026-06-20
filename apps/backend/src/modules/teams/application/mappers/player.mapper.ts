import { PlayerEntity } from '../../domain/entities/player.entity'
import { PlayerHistoryEntity } from '../../domain/entities/player-history.entity'
import { DocumentType, PreferredFoot } from '../../domain/enums'

export interface PlayerRow {
  id: string
  team_id: string
  full_name: string
  birthdate: Date | null
  document: string | null
  document_type: string
  jersey_number: number | null
  preferred_foot: string
  main_position: string
  sub_positions: unknown
  goals: number
  yellow_cards: number
  red_cards: number
  created_at: Date
  updated_at: Date
}

export interface PlayerHistoryRow {
  id: string
  player_id: string
  championship_id: string | null
  from_team_id: string | null
  to_team_id: string | null
  goals: number
  yellow_cards: number
  red_cards: number
  season: string | null
  note: string | null
  created_at: Date
}

export class PlayerMapper {
  static toEntity(row: PlayerRow): PlayerEntity {
    return new PlayerEntity(
      row.id,
      row.team_id,
      row.full_name,
      row.birthdate,
      row.document,
      row.document_type as DocumentType,
      row.jersey_number,
      row.preferred_foot as PreferredFoot,
      row.main_position,
      (row.sub_positions as string[]) ?? [],
      row.goals,
      row.yellow_cards,
      row.red_cards,
      row.created_at,
      row.updated_at,
    )
  }

  static toHistoryEntity(row: PlayerHistoryRow): PlayerHistoryEntity {
    return new PlayerHistoryEntity(
      row.id,
      row.player_id,
      row.championship_id,
      row.from_team_id,
      row.to_team_id,
      row.goals,
      row.yellow_cards,
      row.red_cards,
      row.season,
      row.note,
      row.created_at,
    )
  }
}
