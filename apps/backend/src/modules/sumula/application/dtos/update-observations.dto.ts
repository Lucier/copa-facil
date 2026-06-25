import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateObservationsDto {
  @ApiProperty({ example: 'Partida realizada sem intercorrências.' })
  @IsString()
  observations!: string
}
