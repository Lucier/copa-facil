import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { UserRole } from '../../../auth/domain/roles.enum'

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole
}
