import { Inject, Injectable } from '@nestjs/common'
import { GalleryEntity } from '../../domain/entities/gallery.entity'
import { MediaAssetEntity } from '../../domain/entities/media-asset.entity'
import { GALLERY_REPOSITORY, IGalleryRepository } from '../../domain/repositories/i-gallery.repository'

@Injectable()
export class ListGalleriesUseCase {
  constructor(@Inject(GALLERY_REPOSITORY) private readonly repo: IGalleryRepository) {}

  execute(championshipId?: string): Promise<GalleryEntity[]> {
    return this.repo.findAll(championshipId)
  }

  getAssets(galleryId: string): Promise<MediaAssetEntity[]> {
    return this.repo.findAssets(galleryId)
  }
}
