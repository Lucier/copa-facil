import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { IGalleryRepository } from '../../domain/repositories/i-gallery.repository'
import { GALLERY_REPOSITORY } from '../../domain/repositories/i-gallery.repository'

@Injectable()
export class DeleteGalleryUseCase {
  constructor(@Inject(GALLERY_REPOSITORY) private readonly repo: IGalleryRepository) {}

  async execute(id: string): Promise<void> {
    const gallery = await this.repo.findById(id)
    if (!gallery) throw new NotFoundError('Gallery', id)
    await this.repo.delete(id)
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.repo.deleteAsset(assetId)
  }
}
