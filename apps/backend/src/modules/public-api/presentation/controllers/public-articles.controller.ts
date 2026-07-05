import { Controller, Get, NotFoundException, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { DrizzleService } from '../../../../database/drizzle.service'
import { PublicQueryFiltersDto } from '../../application/dtos/query-filters.dto'
import { toPaginated } from '../../application/dtos/paginated-response.dto'
import { ApiKeyGuard } from '../../infrastructure/guards/api-key.guard'
import { PublicAuditInterceptor } from '../../infrastructure/interceptors/public-audit.interceptor'

interface ArticleRow {
  id: string
  championship_id: string | null
  title: string
  slug: string
  content: string
  category: string | null
  cover_image_url: string | null
  published_at: Date | null
  created_at: Date
}

@ApiTags('Public – Articles')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@UseInterceptors(PublicAuditInterceptor)
@Controller('public/articles')
export class PublicArticlesController {
  constructor(private readonly drizzle: DrizzleService) {}

  @Get()
  @ApiOperation({ summary: 'List published articles' })
  async list(@Query() filters: PublicQueryFiltersDto) {
    const { page, limit } = filters

    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<(ArticleRow & { total: string })[]>`
        SELECT id, championship_id, title, slug, content, category,
               cover_image_url, published_at, created_at,
               COUNT(*) OVER () AS total
        FROM   articles
        WHERE  status = 'published'
        ORDER  BY published_at DESC
        LIMIT  ${limit} OFFSET ${(page - 1) * limit}
      `,
    )

    const total = rows[0] ? parseInt(rows[0].total, 10) : 0
    return toPaginated(rows.map(({ total: _, ...r }) => r), { page, limit, total })
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published article by slug' })
  async findOne(@Param('slug') slug: string) {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<ArticleRow[]>`
        SELECT id, championship_id, title, slug, content, category,
               cover_image_url, published_at, created_at
        FROM   articles
        WHERE  slug = ${slug} AND status = 'published'
        LIMIT  1
      `,
    )
    if (!rows[0]) throw new NotFoundException('Article not found')
    return rows[0]
  }
}
