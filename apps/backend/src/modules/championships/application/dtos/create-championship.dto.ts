import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min, MinLength } from 'class-validator'
import { TournamentFormat } from '../../domain/enums'

export class CreateChampionshipDto {
  @ApiProperty({ example: 'Campeonato Paulista 2025' })
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ example: '2025' })
  @IsString()
  @MinLength(4)
  season!: string

  @ApiProperty({ enum: TournamentFormat })
  @IsEnum(TournamentFormat)
  format!: TournamentFormat

  @ApiPropertyOptional({ description: '1 = single leg, 2 = home and away', default: 1 })
  @IsInt()
  @Min(1)
  @Max(2)
  legs: number = 1

  @ApiPropertyOptional({ description: 'Public URL of the championship logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string
}
