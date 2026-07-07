import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { MediaAssetEntity } from '../../domain/entities/media-asset.entity'
import { IGalleryRepository } from '../../domain/repositories/i-gallery.repository'
import { GALLERY_REPOSITORY } from '../../domain/repositories/i-gallery.repository'
import { AddMediaAssetDto } from '../dtos/add-media-asset.dto'

@Injectable()
export class AddMediaAssetUseCase {
  constructor(@Inject(GALLERY_REPOSITORY) private readonly repo: IGalleryRepository) {}

  async execute(galleryId: string, dto: AddMediaAssetDto): Promise<MediaAssetEntity> {
    const gallery = await this.repo.findById(galleryId)
    if (!gallery) throw new NotFoundError('Gallery', galleryId)
    return this.repo.addAsset({ galleryId, url: dto.url, description: dto.description, order: dto.order })
  }
}
