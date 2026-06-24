import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

export interface StorageUploadOptions {
  key: string
  buffer: Buffer
  mimeType: string
  tenantSchema?: string
}

@Injectable()
export class StorageService {
  private readonly uploadsDir: string
  private readonly baseUrl: string

  constructor(private readonly config: ConfigService) {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads')
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
    const port = this.config.get<number>('PORT') ?? 3001
    this.baseUrl = this.config.get<string>('PUBLIC_URL') ?? `http://localhost:${port}`
  }

  async upload(options: StorageUploadOptions): Promise<string> {
    const ext = this.extFromMime(options.mimeType)
    const filename = `${randomUUID()}${ext}`
    const dest = path.join(this.uploadsDir, filename)
    fs.writeFileSync(dest, options.buffer)
    return `${this.baseUrl}/uploads/${filename}`
  }

  async delete(key: string): Promise<void> {
    const filename = key.split('/uploads/').pop()
    if (!filename) return
    const filePath = path.join(this.uploadsDir, filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
    }
    return map[mime] ?? '.bin'
  }
}
