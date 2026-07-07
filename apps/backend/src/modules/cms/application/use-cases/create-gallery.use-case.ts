import { Inject, Injectable } from '@nestjs/common'
import { GalleryEntity } from '../../domain/entities/gallery.entity'
import { IGalleryRepository } from '../../domain/repositories/i-gallery.repository'
import { GALLERY_REPOSITORY } from '../../domain/repositories/i-gallery.repository'
import { CreateGalleryDto } from '../dtos/create-gallery.dto'

@Injectable()
export class CreateGalleryUseCase {
  constructor(@Inject(GALLERY_REPOSITORY) private readonly repo: IGalleryRepository) {}

  execute(dto: CreateGalleryDto): Promise<GalleryEntity> {
    return this.repo.create({
      championshipId: dto.championshipId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      tags: dto.tags ?? [],
    })
  }
}
