import { IsDateString, IsOptional, IsUUID } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CreateMatchManualDto {
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
}
