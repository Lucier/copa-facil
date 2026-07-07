import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsString, ValidateIf } from 'class-validator'
import { DocumentStatus } from '../../domain/enums'

export class ReviewDocumentDto {
  @ApiProperty({ enum: [DocumentStatus.APROVADO, DocumentStatus.REJEITADO, DocumentStatus.EM_ANALISE] })
  @IsEnum(DocumentStatus)
  status!: DocumentStatus

  @ApiPropertyOptional({ description: 'Required when status is REJEITADO' })
  @ValidateIf((o) => o.status === DocumentStatus.REJEITADO)
  @IsString()
  rejectionReason?: string
}
