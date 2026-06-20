import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { CreateVideoDto } from '../../application/dtos/create-video.dto'
import { CreateVideoUseCase } from '../../application/use-cases/create-video.use-case'
import { ListVideosUseCase } from '../../application/use-cases/list-videos.use-case'

@ApiTags('CMS — Videos')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('videos')
export class VideosController {
  constructor(
    private readonly createVideo: CreateVideoUseCase,
    private readonly listVideos: ListVideosUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a video (YouTube, Vimeo, or direct)' })
  create(@Body() dto: CreateVideoDto) {
    return this.createVideo.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List videos' })
  @ApiQuery({ name: 'championshipId', required: false })
  list(@Query('championshipId') championshipId?: string) {
    return this.listVideos.execute(championshipId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.listVideos.getOne(id)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.listVideos.deleteOne(id)
  }
}
