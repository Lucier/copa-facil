import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acronym?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nickname?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string

  @ApiPropertyOptional({ description: 'Hex color, e.g. #FF0000' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex color' })
  primaryColor?: string

  @ApiPropertyOptional({ description: 'Hex color, e.g. #FFFFFF' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondaryColor must be a valid hex color' })
  secondaryColor?: string
}
