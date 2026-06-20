import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateGalleryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
