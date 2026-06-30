import { IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateRoundManualDto {
  @ApiProperty({ example: 'Rodada 1' })
  @IsString()
  @MinLength(1)
  name!: string

  @ApiPropertyOptional({ description: 'Número da rodada (auto-incrementado se omitido)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  number?: number

  @ApiPropertyOptional({ description: 'ID da fase à qual esta rodada pertence' })
  @IsOptional()
  @IsUUID()
  phaseId?: string
}
