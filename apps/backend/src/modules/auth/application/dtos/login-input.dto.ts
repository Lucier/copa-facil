import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginInputDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'MyPassword1' })
  @IsString()
  @MinLength(8)
  password!: string
}
