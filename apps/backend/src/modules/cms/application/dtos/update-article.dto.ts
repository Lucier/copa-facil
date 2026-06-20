import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string
}
