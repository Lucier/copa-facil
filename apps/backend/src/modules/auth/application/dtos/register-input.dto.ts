import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator'

export class RegisterInputDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({ example: 'MyPassword1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string

  @ApiPropertyOptional({ example: 'Liga Paulista' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  organizationName?: string

  @ApiPropertyOptional({ example: 'liga-paulista' })
  @ValidateIf((o: RegisterInputDto) => !!o.organizationName)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  organizationSlug?: string
}
