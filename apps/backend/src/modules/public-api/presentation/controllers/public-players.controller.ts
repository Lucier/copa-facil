import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface PlayerRow {
  id: string
  team_id: string
  full_name: string
  birthdate: string | null
  jersey_number: number | null
  preferred_foot: string
  main_position: string
  sub_positions: unknown
  goals: number
  yellow_cards: number
  red_cards: number
  created_at: Date
}

@ApiTags('Public – Players')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/players')
export class PublicPlayersController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @Throttle({ global: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'List players' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, search, position, minAge, maxAge, teamId } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(PlayerRow & { total: string })[]>`
        SELECT id, team_id, full_name, birthdate, jersey_number,
               preferred_foot, main_position, sub_positions,
               goals, yellow_cards, red_cards, created_at,
               COUNT(*) OVER () AS total
        FROM   players
        WHERE  (${search ?? null}::text IS NULL OR full_name ILIKE ${'%' + (search ?? '') + '%'})
          AND  (${position ?? null}::text IS NULL OR main_position = ${position ?? null})
          AND  (${teamId ?? null}::uuid IS NULL OR team_id = ${teamId ?? null}::uuid)
          AND  (${minAge ?? null}::int IS NULL
                OR EXTRACT(YEAR FROM AGE(NOW(), birthdate::date)) >= ${minAge ?? null})
          AND  (${maxAge ?? null}::int IS NULL
                OR EXTRACT(YEAR FROM AGE(NOW(), birthdate::date)) <= ${maxAge ?? null})
        ORDER  BY full_name ASC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<PlayerRow[]>`
        SELECT id, team_id, full_name, birthdate, jersey_number,
               preferred_foot, main_position, sub_positions,
               goals, yellow_cards, red_cards, created_at
        FROM   players
        WHERE  id = ${id}
        LIMIT  1
      `,
    )
    return rows[0] ?? null
  }
}
