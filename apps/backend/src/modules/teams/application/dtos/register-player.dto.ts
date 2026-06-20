import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { DocumentType, PreferredFoot } from '../../domain/enums'

export class RegisterPlayerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthdate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document?: string

  @ApiPropertyOptional({ enum: DocumentType, default: DocumentType.CPF })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  jerseyNumber?: number

  @ApiPropertyOptional({ enum: PreferredFoot, default: PreferredFoot.DIREITO })
  @IsOptional()
  @IsEnum(PreferredFoot)
  preferredFoot?: PreferredFoot

  @ApiPropertyOptional({ default: 'goleiro' })
  @IsOptional()
  @IsString()
  mainPosition?: string

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsString({ each: true })
  subPositions?: string[]
}
