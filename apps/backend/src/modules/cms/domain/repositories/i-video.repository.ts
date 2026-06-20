import { VideoProvider } from '../enums'
import { VideoEntity } from '../entities/video.entity'

export interface CreateVideoData {
  championshipId?: string | null
  title: string
  description?: string | null
  provider: VideoProvider
  embedId: string
  embedUrl: string
  thumbnailUrl?: string | null
}

export interface UpdateVideoData {
  title?: string
  description?: string | null
  thumbnailUrl?: string | null
}

export interface IVideoRepository {
  findById(id: string): Promise<VideoEntity | null>
  findAll(championshipId?: string): Promise<VideoEntity[]>
  create(data: CreateVideoData): Promise<VideoEntity>
  update(id: string, data: UpdateVideoData): Promise<VideoEntity>
  delete(id: string): Promise<void>
}

export const VIDEO_REPOSITORY = 'VIDEO_REPOSITORY'
