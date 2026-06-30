import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateMatchManualDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  homeTeamId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  awayTeamId?: string

  @ApiPropertyOptional({ description: 'ISO 8601 datetime' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string

  @ApiPropertyOptional({ enum: ['scheduled', 'cancelled'] })
  @IsOptional()
  @IsIn(['scheduled', 'cancelled'])
  status?: string
}
