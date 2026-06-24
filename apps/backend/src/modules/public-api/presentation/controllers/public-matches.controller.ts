import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface MatchRow {
  id: string
  championship_id: string
  round_id: string
  home_team_id: string | null
  away_team_id: string | null
  group_id: string | null
  bracket_slot: number | null
  status: string
  scheduled_at: Date | null
  created_at: Date
}

interface MatchEventRow {
  id: string
  match_id: string
  type: string
  minute: number | null
  player_id: string | null
  team_id: string | null
  metadata: unknown
  created_at: Date
}

@ApiTags('Public – Matches')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/matches')
export class PublicMatchesController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @Throttle({ global: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'List matches' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, status, date, roundId, championshipId, groupId } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(MatchRow & { total: string })[]>`
        SELECT id, championship_id, round_id, home_team_id, away_team_id,
               group_id, bracket_slot, status, scheduled_at, created_at,
               COUNT(*) OVER () AS total
        FROM   matches
        WHERE  (${status ?? null}::text IS NULL OR status = ${status ?? null})
          AND  (${roundId ?? null}::uuid IS NULL OR round_id = ${roundId ?? null}::uuid)
          AND  (${championshipId ?? null}::uuid IS NULL OR championship_id = ${championshipId ?? null}::uuid)
          AND  (${groupId ?? null}::uuid IS NULL OR group_id = ${groupId ?? null}::uuid)
          AND  (${date ?? null}::date IS NULL OR scheduled_at::date = ${date ?? null}::date)
        ORDER  BY scheduled_at ASC NULLS LAST, created_at ASC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<MatchRow[]>`
        SELECT id, championship_id, round_id, home_team_id, away_team_id,
               group_id, bracket_slot, status, scheduled_at, created_at
        FROM   matches
        WHERE  id = ${id}
        LIMIT  1
      `,
    )
    return rows[0] ?? null
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'List events for a match' })
  async events(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<MatchEventRow[]>`
        SELECT id, match_id, type, minute, player_id, team_id, metadata, created_at
        FROM   match_events
        WHERE  match_id = ${id}
        ORDER  BY minute ASC NULLS LAST, created_at ASC
      `,
    )
    return rows
  }
}
