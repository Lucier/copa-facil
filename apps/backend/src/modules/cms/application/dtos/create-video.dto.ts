import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { VideoProvider } from '../../domain/enums'

export class CreateVideoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiProperty()
  @IsString()
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: VideoProvider })
  @IsEnum(VideoProvider)
  provider!: VideoProvider

  @ApiProperty({ description: 'YouTube video ID, Vimeo ID, or direct URL' })
  @IsString()
  embedId!: string

  @ApiProperty({ description: 'Full embed URL' })
  @IsString()
  embedUrl!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string
}
