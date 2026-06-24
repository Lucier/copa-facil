import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface StandingRow {
  id: string
  championship_id: string
  group_id: string | null
  team_id: string
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  yellow_cards: number
  red_cards: number
  fair_play_points: number
  updated_at: Date
}

@ApiTags('Public – Standings')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/standings')
export class PublicStandingsController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @Throttle({ global: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'List standings, optionally filtered by championship or group' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, championshipId, groupId } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(StandingRow & { total: string })[]>`
        SELECT id, championship_id, group_id, team_id,
               matches_played, wins, draws, losses,
               goals_for, goals_against, goal_difference, points,
               yellow_cards, red_cards, fair_play_points, updated_at,
               COUNT(*) OVER () AS total
        FROM   standings
        WHERE  (${championshipId ?? null}::uuid IS NULL OR championship_id = ${championshipId ?? null}::uuid)
          AND  (${groupId ?? null}::uuid IS NULL OR group_id = ${groupId ?? null}::uuid)
        ORDER  BY points DESC, goal_difference DESC, goals_for DESC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }
}
