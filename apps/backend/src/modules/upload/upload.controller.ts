import {
  Controller, Post, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard'
import { StorageService } from '../../infrastructure/storage/storage.service'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Magic byte signatures for accepted image formats
const SIGNATURES: Array<{ mime: string; match: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png',  match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/gif',  match: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  // WebP: RIFF????WEBP
  {
    mime: 'image/webp',
    match: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
]

function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (buffer.length >= 12 && sig.match(buffer)) return sig.mime
  }
  return null
}

@ApiTags('Upload')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload an image and get back a public URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_SIZE } }))
  async upload(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No file provided')

    // Validate by magic bytes — ignores spoofed Content-Type headers
    const detectedMime = detectMimeFromBuffer(file.buffer)
    if (!detectedMime) {
      throw new BadRequestException('File type not allowed. Accepted: JPEG, PNG, GIF, WebP')
    }

    const url = await this.storage.upload({
      key: file.originalname,
      buffer: file.buffer,
      mimeType: detectedMime,
    })
    return { url }
  }
}
