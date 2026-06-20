import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface ChampionshipRow {
  id: string
  name: string
  season: string
  format: string
  legs: number
  status: string
  created_at: Date
}

interface RoundRow {
  id: string
  championship_id: string
  number: number
  name: string
  phase: string
  group_id: string | null
  created_at: Date
}

@ApiTags('Public – Championships')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/championships')
export class PublicChampionshipsController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @ApiOperation({ summary: 'List championships' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, status, search } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(ChampionshipRow & { total: string })[]>`
        SELECT id, name, season, format, legs, status, created_at,
               COUNT(*) OVER () AS total
        FROM   championships
        WHERE  (${status ?? null}::text IS NULL OR status = ${status ?? null})
          AND  (${search ?? null}::text IS NULL OR name ILIKE ${'%' + (search ?? '') + '%'})
        ORDER  BY created_at DESC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get championship by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ChampionshipRow[]>`
        SELECT id, name, season, format, legs, status, created_at
        FROM   championships
        WHERE  id = ${id}
        LIMIT  1
      `,
    )
    return rows[0] ?? null
  }

  @Get(':id/rounds')
  @ApiOperation({ summary: 'List rounds for a championship' })
  async rounds(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<RoundRow[]>`
        SELECT id, championship_id, number, name, phase, group_id, created_at
        FROM   rounds
        WHERE  championship_id = ${id}
        ORDER  BY number ASC
      `,
    )
    return rows
  }
}
