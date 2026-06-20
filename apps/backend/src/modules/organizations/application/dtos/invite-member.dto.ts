import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum } from 'class-validator'
import { UserRole } from '../../../auth/domain/roles.enum'

export class InviteMemberDto {
  @ApiProperty({ example: 'jogador@email.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole
}
