import { Type } from 'class-transformer'
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class PublicQueryFiltersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['scheduled', 'live', 'finished', 'cancelled', 'active', 'draft', 'published'],
  })
  @IsOptional()
  @IsIn(['scheduled', 'live', 'finished', 'cancelled', 'active', 'draft', 'published'])
  status?: string

  @ApiPropertyOptional({ description: 'Filter matches by date (ISO 8601: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string

  @ApiPropertyOptional({ description: 'Filter by round UUID' })
  @IsOptional()
  @IsUUID()
  roundId?: string

  @ApiPropertyOptional({ description: 'Filter by championship UUID' })
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiPropertyOptional({ description: 'Filter by group UUID' })
  @IsOptional()
  @IsUUID()
  groupId?: string

  @ApiPropertyOptional({ description: 'Filter players by position' })
  @IsOptional()
  @IsString()
  position?: string

  @ApiPropertyOptional({ description: 'Filter players by minimum age', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number

  @ApiPropertyOptional({ description: 'Filter players by maximum age', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number

  @ApiPropertyOptional({ description: 'Full-text search (name, acronym, etc.)' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: 'Filter by team UUID' })
  @IsOptional()
  @IsUUID()
  teamId?: string

  @ApiPropertyOptional({
    description: 'Statistics leaderboard type',
    enum: ['goals', 'assists', 'fair_play'],
    default: 'goals',
  })
  @IsOptional()
  @IsIn(['goals', 'assists', 'fair_play'])
  type?: 'goals' | 'assists' | 'fair_play'
}
