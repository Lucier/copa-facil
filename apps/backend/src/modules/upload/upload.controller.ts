import {
  Controller, Post, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard'
import { StorageService } from '../../infrastructure/storage/storage.service'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

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
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`File type not allowed. Accepted: ${ALLOWED_MIME.join(', ')}`)
    }
    const url = await this.storage.upload({ key: file.originalname, buffer: file.buffer, mimeType: file.mimetype })
    return { url }
  }
}
