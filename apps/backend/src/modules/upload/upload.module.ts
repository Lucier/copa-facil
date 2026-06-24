import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { AuthModule } from '../auth/auth.module'
import { StorageModule } from '../../infrastructure/storage/storage.module'

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UploadController],
})
export class UploadModule {}
