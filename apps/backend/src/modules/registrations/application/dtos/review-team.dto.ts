import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ReviewTeamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string
}
