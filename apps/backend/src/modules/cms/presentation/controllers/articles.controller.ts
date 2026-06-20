import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { CreateArticleDto } from '../../application/dtos/create-article.dto'
import { UpdateArticleDto } from '../../application/dtos/update-article.dto'
import { CreateArticleUseCase } from '../../application/use-cases/create-article.use-case'
import { DeleteArticleUseCase } from '../../application/use-cases/delete-article.use-case'
import { GetArticleUseCase } from '../../application/use-cases/get-article.use-case'
import { ListArticlesUseCase } from '../../application/use-cases/list-articles.use-case'
import { PublishArticleUseCase } from '../../application/use-cases/publish-article.use-case'
import { UpdateArticleUseCase } from '../../application/use-cases/update-article.use-case'

@ApiTags('CMS — Articles')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly createArticle: CreateArticleUseCase,
    private readonly updateArticle: UpdateArticleUseCase,
    private readonly deleteArticle: DeleteArticleUseCase,
    private readonly publishArticle: PublishArticleUseCase,
    private readonly listArticles: ListArticlesUseCase,
    private readonly getArticle: GetArticleUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a news article (draft)' })
  create(@Body() dto: CreateArticleDto, @CurrentUser('sub') userId: string) {
    return this.createArticle.execute(dto, userId)
  }

  @Get()
  @ApiOperation({ summary: 'List articles (admin: all; public: pass published=true)' })
  @ApiQuery({ name: 'championshipId', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  list(@Query('championshipId') championshipId?: string, @Query('published') published?: string) {
    return this.listArticles.execute(championshipId, published === 'true')
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getArticle.execute(id)
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Update article content' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArticleDto) {
    return this.updateArticle.execute(id, dto)
  }

  @Patch(':id/publish')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft article' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.publishArticle.execute(id)
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert article to draft' })
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.publishArticle.unpublish(id)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete article' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteArticle.execute(id)
  }
}
