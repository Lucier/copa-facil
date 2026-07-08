import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { randomUUID } from 'crypto'

export interface StorageUploadOptions {
  key: string
  buffer: Buffer
  mimeType: string
  bucket?: 'assets' | 'documents'
  tenantSchema?: string
}

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: Client
  private bucketAssets!: string
  private bucketDocs!: string
  private publicUrl!: string

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Client({
      endPoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      port: this.config.get<number>('MINIO_PORT') ?? 9000,
      useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
    })
    this.bucketAssets = this.config.getOrThrow<string>('MINIO_BUCKET_ASSETS')
    this.bucketDocs = this.config.getOrThrow<string>('MINIO_BUCKET_DOCS')
    this.publicUrl = this.config.getOrThrow<string>('MINIO_PUBLIC_URL').replace(/\/$/, '')
  }

  async upload(options: StorageUploadOptions): Promise<string> {
    const bucket = options.bucket === 'documents' ? this.bucketDocs : this.bucketAssets
    const ext = this.extFromMime(options.mimeType)
    const objectName = `${randomUUID()}${ext}`
    await this.client.putObject(bucket, objectName, options.buffer, options.buffer.length, {
      'Content-Type': options.mimeType,
    })
    return `${this.publicUrl}/${bucket}/${objectName}`
  }

  async delete(url: string): Promise<void> {
    const prefix = `${this.publicUrl}/`
    if (!url.startsWith(prefix)) return
    const rest = url.slice(prefix.length)
    const slashIdx = rest.indexOf('/')
    if (slashIdx === -1) return
    const bucket = rest.slice(0, slashIdx)
    const objectName = rest.slice(slashIdx + 1)
    await this.client.removeObject(bucket, objectName)
  }

  getPublicUrl(objectName: string): string {
    return `${this.publicUrl}/${this.bucketAssets}/${objectName}`
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
    }
    return map[mime] ?? '.bin'
  }
}
