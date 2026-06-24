import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { ArticleStatus } from '../../domain/enums'

export class CreateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string

  @ApiProperty({ description: 'URL-friendly slug (unique per tenant)' })
  @IsString()
  @MinLength(3)
  slug!: string

  @ApiProperty({ description: 'Markdown or HTML content' })
  @IsString()
  @MaxLength(100_000)
  content!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string

  @ApiPropertyOptional({ enum: ArticleStatus, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus
}
