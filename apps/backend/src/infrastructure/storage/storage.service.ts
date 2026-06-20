import { Injectable } from '@nestjs/common'

export interface StorageUploadOptions {
  key: string
  buffer: Buffer
  mimeType: string
  tenantSchema?: string
}

@Injectable()
export class StorageService {
  async upload(_options: StorageUploadOptions): Promise<string> {
    throw new Error('StorageService not yet configured')
  }

  async delete(_key: string): Promise<void> {
    throw new Error('StorageService not yet configured')
  }

  getPublicUrl(_key: string): string {
    throw new Error('StorageService not yet configured')
  }
}
