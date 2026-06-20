import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { ITeamRepository, TeamRecord } from '../../domain/repositories/i-team.repository'

interface TeamRow {
  id: string
  name: string
  seed: number | null
}

@Injectable()
export class DrizzleTeamRepository implements ITeamRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByIds(ids: string[]): Promise<TeamRecord[]> {
    if (ids.length === 0) return []

    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<TeamRow[]>`
        SELECT id, name, seed
        FROM teams
        WHERE id = ANY(${ids}::uuid[])
      `
    })
    return rows.map((r) => ({ id: r.id, name: r.name, seed: r.seed }))
  }
}
