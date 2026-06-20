import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ResetPasswordConfirmDto {
  @ApiProperty()
  @IsString()
  token!: string

  @ApiProperty({ example: 'NewPassword1' })
  @IsString()
  @MinLength(8)
  newPassword!: string
}
