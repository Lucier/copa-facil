import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class MatchOutputDto {
  @ApiProperty() id!: string
  @ApiProperty() roundId!: string
  @ApiProperty({ nullable: true }) homeTeamId!: string | null
  @ApiProperty({ nullable: true }) awayTeamId!: string | null
  @ApiProperty({ nullable: true }) bracketSlot!: number | null
  @ApiProperty() isBye!: boolean
  @ApiProperty() status!: string
}

export class RoundOutputDto {
  @ApiProperty() id!: string
  @ApiProperty() number!: number
  @ApiProperty() name!: string
  @ApiProperty() phase!: string
  @ApiPropertyOptional({ nullable: true }) groupId!: string | null
  @ApiProperty({ type: [MatchOutputDto] }) matches!: MatchOutputDto[]
}

export class GroupOutputDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty() orderIndex!: number
  @ApiProperty({ type: [RoundOutputDto] }) rounds!: RoundOutputDto[]
}

export class BracketOutputDto {
  @ApiProperty() championshipId!: string
  @ApiProperty() format!: string
  @ApiPropertyOptional({ type: [GroupOutputDto] }) groups?: GroupOutputDto[]
  @ApiProperty({ type: [RoundOutputDto] }) rounds!: RoundOutputDto[]
}
