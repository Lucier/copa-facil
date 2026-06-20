import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { VideoEntity } from '../../domain/entities/video.entity'
import { VideoProvider } from '../../domain/enums'
import {
  CreateVideoData,
  IVideoRepository,
  UpdateVideoData,
} from '../../domain/repositories/i-video.repository'

interface VideoRow {
  id: string
  championship_id: string | null
  title: string
  description: string | null
  provider: string
  embed_id: string
  embed_url: string
  thumbnail_url: string | null
  created_at: Date
  updated_at: Date
}

function toEntity(r: VideoRow): VideoEntity {
  return new VideoEntity(
    r.id, r.championship_id, r.title, r.description,
    r.provider as VideoProvider, r.embed_id, r.embed_url,
    r.thumbnail_url, r.created_at, r.updated_at,
  )
}

@Injectable()
export class DrizzleVideoRepository implements IVideoRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<VideoEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<VideoRow[]>`SELECT id, championship_id, title, description, provider, embed_id, embed_url, thumbnail_url, created_at, updated_at FROM videos WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toEntity(rows[0]) : null
  }

  async findAll(championshipId?: string): Promise<VideoEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      championshipId
        ? tx<VideoRow[]>`SELECT id, championship_id, title, description, provider, embed_id, embed_url, thumbnail_url, created_at, updated_at FROM videos WHERE championship_id = ${championshipId} ORDER BY created_at DESC`
        : tx<VideoRow[]>`SELECT id, championship_id, title, description, provider, embed_id, embed_url, thumbnail_url, created_at, updated_at FROM videos ORDER BY created_at DESC`,
    )
    return rows.map(toEntity)
  }

  async create(data: CreateVideoData): Promise<VideoEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<VideoRow[]>`
        INSERT INTO videos (championship_id, title, description, provider, embed_id, embed_url, thumbnail_url)
        VALUES (${data.championshipId ?? null}, ${data.title}, ${data.description ?? null}, ${data.provider}, ${data.embedId}, ${data.embedUrl}, ${data.thumbnailUrl ?? null})
        RETURNING id, championship_id, title, description, provider, embed_id, embed_url, thumbnail_url, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async update(id: string, data: UpdateVideoData): Promise<VideoEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<VideoRow[]>`
        UPDATE videos SET
          title         = COALESCE(${data.title ?? null}, title),
          description   = CASE WHEN ${data.description !== undefined} THEN ${data.description ?? null} ELSE description END,
          thumbnail_url = CASE WHEN ${data.thumbnailUrl !== undefined} THEN ${data.thumbnailUrl ?? null} ELSE thumbnail_url END,
          updated_at    = NOW()
        WHERE id = ${id}
        RETURNING id, championship_id, title, description, provider, embed_id, embed_url, thumbnail_url, created_at, updated_at
      `,
    )
    return toEntity(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) => tx`DELETE FROM videos WHERE id = ${id}`)
  }
}
