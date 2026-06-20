import { Inject, Injectable } from '@nestjs/common'
import { VideoEntity } from '../../domain/entities/video.entity'
import { VIDEO_REPOSITORY, IVideoRepository } from '../../domain/repositories/i-video.repository'
import { CreateVideoDto } from '../dtos/create-video.dto'

@Injectable()
export class CreateVideoUseCase {
  constructor(@Inject(VIDEO_REPOSITORY) private readonly repo: IVideoRepository) {}

  execute(dto: CreateVideoDto): Promise<VideoEntity> {
    return this.repo.create({
      championshipId: dto.championshipId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      provider: dto.provider,
      embedId: dto.embedId,
      embedUrl: dto.embedUrl,
      thumbnailUrl: dto.thumbnailUrl ?? null,
    })
  }
}
