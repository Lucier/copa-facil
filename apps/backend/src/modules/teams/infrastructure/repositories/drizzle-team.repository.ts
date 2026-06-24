import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { TeamEntity } from '../../domain/entities/team.entity'
import {
  CreateTeamData,
  ITeamRepository,
  UpdateTeamData,
} from '../../domain/repositories/i-team.repository'
import { TeamMapper, TeamRow } from '../../application/mappers/team.mapper'

@Injectable()
export class DrizzleTeamRepository implements ITeamRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private readonly cols = `id, name, acronym, city, nickname, logo_url, primary_color, secondary_color, seed, invite_token, created_at, updated_at`

  async findById(id: string): Promise<TeamEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        SELECT ${tx.unsafe(this.cols)}
        FROM teams
        WHERE id = ${id}
        LIMIT 1
      `
    })
    return rows[0] ? TeamMapper.toEntity(rows[0]) : null
  }

  async findByInviteToken(token: string): Promise<TeamEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        SELECT ${tx.unsafe(this.cols)}
        FROM teams
        WHERE invite_token = ${token}
        LIMIT 1
      `
    })
    return rows[0] ? TeamMapper.toEntity(rows[0]) : null
  }

  async findAll(): Promise<TeamEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        SELECT ${tx.unsafe(this.cols)}
        FROM teams
        ORDER BY name ASC
      `
    })
    return rows.map(TeamMapper.toEntity)
  }

  async create(data: CreateTeamData): Promise<TeamEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        INSERT INTO teams (name, acronym, city, nickname, logo_url, primary_color, secondary_color, seed)
        VALUES (
          ${data.name},
          ${data.acronym ?? null},
          ${data.city ?? null},
          ${data.nickname ?? null},
          ${data.logoUrl ?? null},
          ${data.primaryColor ?? null},
          ${data.secondaryColor ?? null},
          ${data.seed ?? null}
        )
        RETURNING ${tx.unsafe(this.cols)}
      `
    })
    return TeamMapper.toEntity(rows[0])
  }

  async update(id: string, data: UpdateTeamData): Promise<TeamEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        UPDATE teams SET
          name             = COALESCE(${data.name ?? null}, name),
          acronym          = CASE WHEN ${data.acronym !== undefined} THEN ${data.acronym ?? null} ELSE acronym END,
          city             = CASE WHEN ${data.city !== undefined} THEN ${data.city ?? null} ELSE city END,
          nickname         = CASE WHEN ${data.nickname !== undefined} THEN ${data.nickname ?? null} ELSE nickname END,
          logo_url         = CASE WHEN ${data.logoUrl !== undefined} THEN ${data.logoUrl ?? null} ELSE logo_url END,
          primary_color    = CASE WHEN ${data.primaryColor !== undefined} THEN ${data.primaryColor ?? null} ELSE primary_color END,
          secondary_color  = CASE WHEN ${data.secondaryColor !== undefined} THEN ${data.secondaryColor ?? null} ELSE secondary_color END,
          seed             = CASE WHEN ${data.seed !== undefined} THEN ${data.seed ?? null} ELSE seed END,
          updated_at       = NOW()
        WHERE id = ${id}
        RETURNING ${tx.unsafe(this.cols)}
      `
    })
    return TeamMapper.toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM teams WHERE id = ${id}`
    })
  }
}
