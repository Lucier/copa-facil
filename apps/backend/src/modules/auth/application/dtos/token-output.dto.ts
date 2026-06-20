import { ApiProperty } from '@nestjs/swagger'

export class AuthUserDto {
  @ApiProperty() id!: string
  @ApiProperty() email!: string
  @ApiProperty() name!: string
}

export class TokenOutputDto {
  @ApiProperty() accessToken!: string
  @ApiProperty() refreshToken!: string
  @ApiProperty() expiresIn!: number
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto
}
