import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginInputDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({ example: 'MyPassword1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}
