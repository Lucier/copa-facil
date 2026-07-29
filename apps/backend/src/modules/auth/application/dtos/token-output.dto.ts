import { ApiProperty } from '@nestjs/swagger'

export class AuthUserDto {
  @ApiProperty() id!: string
  @ApiProperty() email!: string
  @ApiProperty() name!: string
}

export class TokenOutputDto {
  @ApiProperty() accessToken!: string
  @ApiProperty() expiresIn!: number
  // refreshExpiresIn is used server-side to set the cookie maxAge — not sent to the client
  refreshExpiresIn!: number
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto
}
