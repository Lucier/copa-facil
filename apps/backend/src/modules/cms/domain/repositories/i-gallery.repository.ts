import { GalleryEntity } from '../entities/gallery.entity'
import { MediaAssetEntity } from '../entities/media-asset.entity'

export interface CreateGalleryData {
  championshipId?: string | null
  title: string
  description?: string | null
  tags?: string[]
}

export interface AddMediaAssetData {
  galleryId: string
  url: string
  description?: string | null
  order?: number
}

export interface IGalleryRepository {
  findById(id: string): Promise<GalleryEntity | null>
  findAll(championshipId?: string): Promise<GalleryEntity[]>
  create(data: CreateGalleryData): Promise<GalleryEntity>
  delete(id: string): Promise<void>
  addAsset(data: AddMediaAssetData): Promise<MediaAssetEntity>
  findAssets(galleryId: string): Promise<MediaAssetEntity[]>
  deleteAsset(assetId: string): Promise<void>
}

export const GALLERY_REPOSITORY = 'GALLERY_REPOSITORY'
