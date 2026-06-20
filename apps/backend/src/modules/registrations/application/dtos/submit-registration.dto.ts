import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class SubmitRegistrationDto {
  @ApiProperty()
  @IsUUID()
  championshipId!: string

  @ApiProperty()
  @IsUUID()
  teamId!: string
}
