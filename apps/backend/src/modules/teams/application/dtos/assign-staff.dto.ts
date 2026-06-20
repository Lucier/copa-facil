import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { StaffRole } from '../../domain/enums'

export class AssignStaffDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string

  @ApiPropertyOptional({ enum: StaffRole, default: StaffRole.AUXILIAR })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole
}
