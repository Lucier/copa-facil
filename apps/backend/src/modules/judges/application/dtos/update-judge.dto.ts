import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { JudgeRole, LicenseCategory } from '../../domain/enums'

export class UpdateJudgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string

  @ApiPropertyOptional({ enum: LicenseCategory })
  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory

  @ApiPropertyOptional({ enum: JudgeRole })
  @IsOptional()
  @IsEnum(JudgeRole)
  role?: JudgeRole

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
