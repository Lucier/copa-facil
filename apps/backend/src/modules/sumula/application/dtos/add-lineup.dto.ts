import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AddLineupDto {
  @ApiProperty({ example: 'uuid-of-team' })
  @IsUUID()
  teamId!: string

  @ApiProperty({ example: 'uuid-of-player' })
  @IsUUID()
  playerId!: string

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  jerseyNumber?: number

  @ApiPropertyOptional({ example: 'atacante' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isStarter?: boolean

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCaptain?: boolean
}
