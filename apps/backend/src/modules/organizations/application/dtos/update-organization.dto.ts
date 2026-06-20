import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string
}
