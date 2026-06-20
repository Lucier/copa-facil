import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator'

export class AddMediaAssetDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  url!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}
