import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface StatRow {
  id: string
  championship_id: string
  team_id: string
  player_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  fair_play_points: number
  updated_at: Date
}

@ApiTags('Public – Statistics')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/statistics')
export class PublicStatisticsController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get('leaderboard')
  @Throttle({ global: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Player leaderboard (goals | assists | fair_play)' })
  async leaderboard(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, championshipId, type = 'goals' } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(StatRow & { total: string })[]>`
        SELECT ps.id, ps.championship_id, ps.team_id, ps.player_id,
               ps.goals, ps.assists, ps.yellow_cards, ps.red_cards,
               ps.fair_play_points, ps.updated_at,
               COUNT(*) OVER () AS total
        FROM   player_statistics ps
        WHERE  (${championshipId ?? null}::uuid IS NULL OR ps.championship_id = ${championshipId ?? null}::uuid)
        ORDER  BY CASE
                    WHEN ${type} = 'assists'    THEN ps.assists
                    WHEN ${type} = 'fair_play'  THEN -ps.fair_play_points
                    ELSE ps.goals
                  END DESC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }
}
