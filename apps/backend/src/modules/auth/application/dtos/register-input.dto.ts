import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator'

export class RegisterInputDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'MyPassword1' })
  @IsString()
  @MinLength(8)
  password!: string

  @ApiPropertyOptional({ example: 'Liga Paulista' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  organizationName?: string

  @ApiPropertyOptional({ example: 'liga-paulista' })
  @ValidateIf((o: RegisterInputDto) => !!o.organizationName)
  @IsString()
  @MinLength(2)
  organizationSlug?: string
}
