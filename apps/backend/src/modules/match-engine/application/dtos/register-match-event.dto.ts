import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator'
import { CardColor, GoalType, MatchEventType } from '../../domain/enums'

export class RegisterMatchEventDto {
  @ApiProperty({ enum: MatchEventType })
  @IsEnum(MatchEventType)
  eventType!: MatchEventType

  @ApiProperty({ description: 'Team ID performing the event' })
  @IsUUID()
  teamId!: string

  @ApiPropertyOptional({ description: 'Primary player (scorer, carded, subbed-out)' })
  @IsOptional()
  @IsUUID()
  playerId?: string

  @ApiPropertyOptional({ description: 'Assist player (for GOL events)' })
  @IsOptional()
  @IsUUID()
  assistPlayerId?: string

  @ApiPropertyOptional({ description: 'Player coming on (SUBSTITUICAO)' })
  @IsOptional()
  @IsUUID()
  playerInId?: string

  @ApiProperty({ description: 'Match minute (1–120)' })
  @IsInt()
  @Min(1)
  @Max(120)
  minute!: number

  @ApiPropertyOptional({ enum: GoalType, description: 'Required for GOL events' })
  @ValidateIf((o) => o.eventType === MatchEventType.GOL)
  @IsEnum(GoalType)
  goalType?: GoalType

  @ApiPropertyOptional({ enum: CardColor, description: 'Required for CARTAO events' })
  @ValidateIf((o) => o.eventType === MatchEventType.CARTAO)
  @IsEnum(CardColor)
  cardColor?: CardColor
}
