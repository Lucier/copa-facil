import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class TransferPlayerDto {
  @ApiProperty({ description: 'Target team ID' })
  @IsUUID()
  toTeamId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}
