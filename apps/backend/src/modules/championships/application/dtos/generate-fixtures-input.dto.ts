import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator'

export class GenerateFixturesInputDto {
  @ApiProperty({
    description: 'Team IDs ordered by seed (index 0 = top seed)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  teamIds!: string[]

  @ApiPropertyOptional({ description: 'Number of groups (grupos_mata_mata only)' })
  @IsOptional()
  @IsInt()
  @Min(2)
  groupCount?: number

  @ApiPropertyOptional({ description: 'Qualifiers per group advancing to knockout' })
  @IsOptional()
  @IsInt()
  @Min(1)
  qualifiersPerGroup?: number

  @ApiPropertyOptional({ description: 'Start date for round 1 (ISO date: YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string

  @ApiPropertyOptional({ description: 'Days between rounds' })
  @IsOptional()
  @IsInt()
  @Min(1)
  daysBetweenRounds?: number

  @ApiPropertyOptional({ description: 'Default match time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  defaultTime?: string
}
