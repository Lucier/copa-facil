import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class ConcludeMatchDto {
  @ApiProperty({ description: 'Final home team score' })
  @IsInt()
  @Min(0)
  homeScore!: number

  @ApiProperty({ description: 'Final away team score' })
  @IsInt()
  @Min(0)
  awayScore!: number
}
