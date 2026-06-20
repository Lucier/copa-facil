import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface TeamRow {
  id: string
  name: string
  acronym: string | null
  city: string | null
  nickname: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  seed: number | null
  created_at: Date
}

@ApiTags('Public – Teams')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/teams')
export class PublicTeamsController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @ApiOperation({ summary: 'List teams' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit, search } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(TeamRow & { total: string })[]>`
        SELECT id, name, acronym, city, nickname, logo_url,
               primary_color, secondary_color, seed, created_at,
               COUNT(*) OVER () AS total
        FROM   teams
        WHERE  (${search ?? null}::text IS NULL
                OR name ILIKE ${'%' + (search ?? '') + '%'}
                OR acronym ILIKE ${'%' + (search ?? '') + '%'})
        ORDER  BY name ASC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<TeamRow[]>`
        SELECT id, name, acronym, city, nickname, logo_url,
               primary_color, secondary_color, seed, created_at
        FROM   teams
        WHERE  id = ${id}
        LIMIT  1
      `,
    )
    return rows[0] ?? null
  }
}
