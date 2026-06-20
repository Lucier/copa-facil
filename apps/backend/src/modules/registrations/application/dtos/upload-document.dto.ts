import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { RegistrationDocumentType } from '../../domain/enums'

export class UploadDocumentDto {
  @ApiPropertyOptional({ description: 'Player ID if this document belongs to a specific player' })
  @IsOptional()
  @IsUUID()
  playerId?: string

  @ApiProperty({ enum: RegistrationDocumentType })
  @IsEnum(RegistrationDocumentType)
  documentType!: RegistrationDocumentType

  @ApiProperty({ description: 'Cloud storage URL of the uploaded file' })
  @IsString()
  fileUrl!: string
}
