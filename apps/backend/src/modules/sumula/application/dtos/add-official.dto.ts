import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OfficialRole } from '../../domain/enums'

export class AddOfficialDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MaxLength(150)
  name!: string

  @ApiProperty({ enum: OfficialRole })
  @IsEnum(OfficialRole)
  role!: OfficialRole

  @ApiPropertyOptional({ example: 'FIFA-2023-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string
}
