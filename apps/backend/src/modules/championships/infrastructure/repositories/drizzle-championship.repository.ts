import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'
import { ChampionshipStatus, TournamentFormat } from '../../domain/enums'
import {
  CreateChampionshipData,
  IChampionshipRepository,
} from '../../domain/repositories/i-championship.repository'

interface ChampRow {
  id: string
  name: string
  season: string
  format: string
  legs: number
  status: string
  logo_url: string | null
  created_at: Date
  updated_at: Date
}

@Injectable()
export class DrizzleChampionshipRepository implements IChampionshipRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<ChampionshipEntity | null> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<ChampRow[]>`
        SELECT id, name, season, format, legs, status, logo_url, created_at, updated_at
        FROM championships
        WHERE id = ${id}
        LIMIT 1
      `
    })
    return rows[0] ? this.toEntity(rows[0]) : null
  }

  async findAll(): Promise<ChampionshipEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<ChampRow[]>`
        SELECT id, name, season, format, legs, status, logo_url, created_at, updated_at
        FROM championships
        ORDER BY created_at DESC
      `
    })
    return rows.map((r) => this.toEntity(r))
  }

  async create(data: CreateChampionshipData): Promise<ChampionshipEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<ChampRow[]>`
        INSERT INTO championships (name, season, format, legs, status, logo_url)
        VALUES (${data.name}, ${data.season}, ${data.format}, ${data.legs}, 'draft', ${data.logoUrl ?? null})
        RETURNING id, name, season, format, legs, status, logo_url, created_at, updated_at
      `
    })
    return this.toEntity(rows[0])
  }

  async updateStatus(id: string, status: ChampionshipStatus): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`
        UPDATE championships
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
      `
    })
  }

  private toEntity(row: ChampRow): ChampionshipEntity {
    return new ChampionshipEntity(
      row.id,
      row.name,
      row.season,
      row.format as TournamentFormat,
      row.legs,
      row.status as ChampionshipStatus,
      row.logo_url ?? null,
      row.created_at,
      row.updated_at,
    )
  }
}
