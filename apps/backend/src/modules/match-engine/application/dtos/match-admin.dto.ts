import { ApiProperty } from '@nestjs/swagger'

export class MatchAdminDto {
  @ApiProperty() id!: string
  @ApiProperty() status!: string
  @ApiProperty({ nullable: true }) homeTeamId!: string | null
  @ApiProperty({ nullable: true }) awayTeamId!: string | null
  @ApiProperty({ nullable: true }) homeTeamName!: string | null
  @ApiProperty({ nullable: true }) homeTeamAcronym!: string | null
  @ApiProperty({ nullable: true }) awayTeamName!: string | null
  @ApiProperty({ nullable: true }) awayTeamAcronym!: string | null
  @ApiProperty() homeScore!: number
  @ApiProperty() awayScore!: number
  @ApiProperty({ nullable: true }) scheduledAt!: string | null
  @ApiProperty({ nullable: true }) startedAt!: string | null
  @ApiProperty({ nullable: true }) endedAt!: string | null
  @ApiProperty() roundId!: string
  @ApiProperty() roundNumber!: number
  @ApiProperty() roundName!: string
  @ApiProperty() roundPhase!: string
  @ApiProperty({ nullable: true }) groupId!: string | null
  @ApiProperty({ nullable: true }) bracketSlot!: number | null
  @ApiProperty() isBye!: boolean
}
