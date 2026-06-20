import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { AddMediaAssetDto } from '../../application/dtos/add-media-asset.dto'
import { CreateGalleryDto } from '../../application/dtos/create-gallery.dto'
import { AddMediaAssetUseCase } from '../../application/use-cases/add-media-asset.use-case'
import { CreateGalleryUseCase } from '../../application/use-cases/create-gallery.use-case'
import { DeleteGalleryUseCase } from '../../application/use-cases/delete-gallery.use-case'
import { ListGalleriesUseCase } from '../../application/use-cases/list-galleries.use-case'

@ApiTags('CMS — Galleries')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('galleries')
export class GalleriesController {
  constructor(
    private readonly createGallery: CreateGalleryUseCase,
    private readonly listGalleries: ListGalleriesUseCase,
    private readonly deleteGallery: DeleteGalleryUseCase,
    private readonly addAsset: AddMediaAssetUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a photo gallery album' })
  create(@Body() dto: CreateGalleryDto) {
    return this.createGallery.execute(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List galleries' })
  @ApiQuery({ name: 'championshipId', required: false })
  list(@Query('championshipId') championshipId?: string) {
    return this.listGalleries.execute(championshipId)
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'List all images in a gallery' })
  assets(@Param('id', ParseUUIDPipe) id: string) {
    return this.listGalleries.getAssets(id)
  }

  @Post(':id/assets')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an image to a gallery' })
  addImage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMediaAssetDto) {
    return this.addAsset.execute(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a gallery (cascades to assets)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteGallery.execute(id)
  }

  @Delete(':id/assets/:assetId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an image from a gallery' })
  removeAsset(
    @Param('id', ParseUUIDPipe) _galleryId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.deleteGallery.deleteAsset(assetId)
  }
}
