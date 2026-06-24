import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { PlayerHistoryEntity } from '../../domain/entities/player-history.entity'
import {
  CreatePlayerData,
  CreatePlayerHistoryData,
  IPlayerRepository,
  UpdatePlayerData,
} from '../../domain/repositories/i-player.repository'
import { PlayerHistoryRow, PlayerMapper, PlayerRow } from '../../application/mappers/player.mapper'

@Injectable()
export class DrizzlePlayerRepository implements IPlayerRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private readonly selectCols = `
    id, team_id, full_name, photo_url, birthdate, document, document_type, jersey_number,
    preferred_foot, main_position, sub_positions, goals, yellow_cards, red_cards,
    created_at, updated_at
  `

  async findById(id: string): Promise<PlayerEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerRow[]>`
        SELECT ${tx(this.selectCols.split(',').map((c) => c.trim()).filter(Boolean))}
        FROM players
        WHERE id = ${id}
        LIMIT 1
      `
    })
    return rows[0] ? PlayerMapper.toEntity(rows[0]) : null
  }

  async findByTeamId(teamId: string): Promise<PlayerEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerRow[]>`
        SELECT id, team_id, full_name, photo_url, birthdate, document, document_type, jersey_number,
               preferred_foot, main_position, sub_positions, goals, yellow_cards, red_cards,
               created_at, updated_at
        FROM players
        WHERE team_id = ${teamId}
        ORDER BY full_name ASC
      `
    })
    return rows.map(PlayerMapper.toEntity)
  }

  async create(data: CreatePlayerData): Promise<PlayerEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerRow[]>`
        INSERT INTO players (
          team_id, full_name, photo_url, birthdate, document, document_type,
          jersey_number, preferred_foot, main_position, sub_positions
        )
        VALUES (
          ${data.teamId},
          ${data.fullName},
          ${data.photoUrl ?? null},
          ${data.birthdate ? data.birthdate.toISOString().split('T')[0] : null},
          ${data.document ?? null},
          ${data.documentType ?? 'cpf'},
          ${data.jerseyNumber ?? null},
          ${data.preferredFoot ?? 'direito'},
          ${data.mainPosition ?? 'goleiro'},
          ${JSON.stringify(data.subPositions ?? [])}
        )
        RETURNING id, team_id, full_name, photo_url, birthdate, document, document_type, jersey_number,
                  preferred_foot, main_position, sub_positions, goals, yellow_cards, red_cards,
                  created_at, updated_at
      `
    })
    return PlayerMapper.toEntity(rows[0])
  }

  async update(id: string, data: UpdatePlayerData): Promise<PlayerEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerRow[]>`
        UPDATE players SET
          full_name      = COALESCE(${data.fullName ?? null}, full_name),
          photo_url      = CASE WHEN ${data.photoUrl !== undefined} THEN ${data.photoUrl ?? null} ELSE photo_url END,
          birthdate      = CASE WHEN ${data.birthdate !== undefined} THEN ${data.birthdate ? data.birthdate.toISOString().split('T')[0] : null} ELSE birthdate END,
          document       = CASE WHEN ${data.document !== undefined} THEN ${data.document ?? null} ELSE document END,
          document_type  = COALESCE(${data.documentType ?? null}, document_type),
          jersey_number  = CASE WHEN ${data.jerseyNumber !== undefined} THEN ${data.jerseyNumber ?? null} ELSE jersey_number END,
          preferred_foot = COALESCE(${data.preferredFoot ?? null}, preferred_foot),
          main_position  = COALESCE(${data.mainPosition ?? null}, main_position),
          sub_positions  = CASE WHEN ${data.subPositions !== undefined} THEN ${JSON.stringify(data.subPositions ?? [])}::jsonb ELSE sub_positions END,
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING id, team_id, full_name, photo_url, birthdate, document, document_type, jersey_number,
                  preferred_foot, main_position, sub_positions, goals, yellow_cards, red_cards,
                  created_at, updated_at
      `
    })
    return PlayerMapper.toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM players WHERE id = ${id}`
    })
  }

  async transferToTeam(playerId: string, toTeamId: string): Promise<PlayerEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerRow[]>`
        UPDATE players
        SET team_id = ${toTeamId}, updated_at = NOW()
        WHERE id = ${playerId}
        RETURNING id, team_id, full_name, photo_url, birthdate, document, document_type, jersey_number,
                  preferred_foot, main_position, sub_positions, goals, yellow_cards, red_cards,
                  created_at, updated_at
      `
    })
    return PlayerMapper.toEntity(rows[0])
  }

  async findHistoryByPlayerId(playerId: string): Promise<PlayerHistoryEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerHistoryRow[]>`
        SELECT id, player_id, championship_id, from_team_id, to_team_id,
               goals, yellow_cards, red_cards, season, note, created_at
        FROM player_history
        WHERE player_id = ${playerId}
        ORDER BY created_at DESC
      `
    })
    return rows.map(PlayerMapper.toHistoryEntity)
  }

  async createHistory(data: CreatePlayerHistoryData): Promise<PlayerHistoryEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<PlayerHistoryRow[]>`
        INSERT INTO player_history (
          player_id, championship_id, from_team_id, to_team_id,
          goals, yellow_cards, red_cards, season, note
        )
        VALUES (
          ${data.playerId},
          ${data.championshipId ?? null},
          ${data.fromTeamId ?? null},
          ${data.toTeamId ?? null},
          ${data.goals ?? 0},
          ${data.yellowCards ?? 0},
          ${data.redCards ?? 0},
          ${data.season ?? null},
          ${data.note ?? null}
        )
        RETURNING id, player_id, championship_id, from_team_id, to_team_id,
                  goals, yellow_cards, red_cards, season, note, created_at
      `
    })
    return PlayerMapper.toHistoryEntity(rows[0])
  }
}
