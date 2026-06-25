import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class OpenSumulaDto {
  @ApiPropertyOptional({ example: 'Estádio Municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  venue?: string
}
