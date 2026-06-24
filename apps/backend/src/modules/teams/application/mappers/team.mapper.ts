import { TeamEntity } from '../../domain/entities/team.entity'

export interface TeamRow {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  seed: number | null
  invite_token: string
  created_at: Date
  updated_at: Date
}

export class TeamMapper {
  static toEntity(row: TeamRow): TeamEntity {
    return new TeamEntity(
      row.id,
      row.name,
      row.acronym,
      row.city,
      row.nickname,
      row.logo_url,
      row.primary_color,
      row.secondary_color,
      row.seed,
      row.invite_token,
      row.created_at,
      row.updated_at,
    )
  }
}
