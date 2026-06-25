import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { JudgeRole, LicenseCategory } from '../../domain/enums'

export class CreateJudgeDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string

  @ApiPropertyOptional({ example: 'CBF-2023-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string

  @ApiPropertyOptional({ enum: LicenseCategory })
  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory

  @ApiProperty({ enum: JudgeRole })
  @IsEnum(JudgeRole)
  role!: JudgeRole

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @ApiPropertyOptional({ example: 'joao@arbitragem.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string
}
