import { Inject, Injectable } from '@nestjs/common'
import { NotFoundError } from '../../../../shared/errors'
import { VideoEntity } from '../../domain/entities/video.entity'
import { VIDEO_REPOSITORY, IVideoRepository } from '../../domain/repositories/i-video.repository'

@Injectable()
export class ListVideosUseCase {
  constructor(@Inject(VIDEO_REPOSITORY) private readonly repo: IVideoRepository) {}

  execute(championshipId?: string): Promise<VideoEntity[]> {
    return this.repo.findAll(championshipId)
  }

  async getOne(id: string): Promise<VideoEntity> {
    const video = await this.repo.findById(id)
    if (!video) throw new NotFoundError('Video', id)
    return video
  }

  async deleteOne(id: string): Promise<void> {
    const video = await this.repo.findById(id)
    if (!video) throw new NotFoundError('Video', id)
    await this.repo.delete(id)
  }
}
