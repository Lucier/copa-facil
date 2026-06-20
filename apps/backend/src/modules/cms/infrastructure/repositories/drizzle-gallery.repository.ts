import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { GalleryEntity } from '../../domain/entities/gallery.entity'
import { MediaAssetEntity } from '../../domain/entities/media-asset.entity'
import {
  AddMediaAssetData,
  CreateGalleryData,
  IGalleryRepository,
} from '../../domain/repositories/i-gallery.repository'

interface GalleryRow {
  id: string
  championship_id: string | null
  title: string
  description: string | null
  tags: string[]
  created_at: Date
  updated_at: Date
}

interface AssetRow {
  id: string
  gallery_id: string
  url: string
  description: string | null
  order: number
  created_at: Date
}

function toGallery(r: GalleryRow): GalleryEntity {
  return new GalleryEntity(r.id, r.championship_id, r.title, r.description, r.tags ?? [], r.created_at, r.updated_at)
}

function toAsset(r: AssetRow): MediaAssetEntity {
  return new MediaAssetEntity(r.id, r.gallery_id, r.url, r.description, r.order, r.created_at)
}

@Injectable()
export class DrizzleGalleryRepository implements IGalleryRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<GalleryEntity | null> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<GalleryRow[]>`SELECT id, championship_id, title, description, tags, created_at, updated_at FROM galleries WHERE id = ${id} LIMIT 1`,
    )
    return rows[0] ? toGallery(rows[0]) : null
  }

  async findAll(championshipId?: string): Promise<GalleryEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      championshipId
        ? tx<GalleryRow[]>`SELECT id, championship_id, title, description, tags, created_at, updated_at FROM galleries WHERE championship_id = ${championshipId} ORDER BY created_at DESC`
        : tx<GalleryRow[]>`SELECT id, championship_id, title, description, tags, created_at, updated_at FROM galleries ORDER BY created_at DESC`,
    )
    return rows.map(toGallery)
  }

  async create(data: CreateGalleryData): Promise<GalleryEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<GalleryRow[]>`
        INSERT INTO galleries (championship_id, title, description, tags)
        VALUES (${data.championshipId ?? null}, ${data.title}, ${data.description ?? null}, ${JSON.stringify(data.tags ?? [])}::jsonb)
        RETURNING id, championship_id, title, description, tags, created_at, updated_at
      `,
    )
    return toGallery(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) => tx`DELETE FROM galleries WHERE id = ${id}`)
  }

  async addAsset(data: AddMediaAssetData): Promise<MediaAssetEntity> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<AssetRow[]>`
        INSERT INTO media_assets (gallery_id, url, description, "order")
        VALUES (${data.galleryId}, ${data.url}, ${data.description ?? null}, ${data.order ?? 0})
        RETURNING id, gallery_id, url, description, "order" AS order, created_at
      `,
    )
    return toAsset(rows[0])
  }

  async findAssets(galleryId: string): Promise<MediaAssetEntity[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<AssetRow[]>`SELECT id, gallery_id, url, description, "order" AS order, created_at FROM media_assets WHERE gallery_id = ${galleryId} ORDER BY "order" ASC, created_at ASC`,
    )
    return rows.map(toAsset)
  }

  async deleteAsset(assetId: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) => tx`DELETE FROM media_assets WHERE id = ${assetId}`)
  }
}
