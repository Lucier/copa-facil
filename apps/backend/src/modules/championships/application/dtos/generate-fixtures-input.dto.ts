import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsInt, IsOptional, IsUUID, Min } from 'class-validator'

export class GenerateFixturesInputDto {
  @ApiProperty({
    description: 'Team IDs ordered by seed (index 0 = top seed)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  teamIds!: string[]

  @ApiPropertyOptional({ description: 'Number of groups (grupos_mata_mata only)' })
  @IsOptional()
  @IsInt()
  @Min(2)
  groupCount?: number

  @ApiPropertyOptional({ description: 'Qualifiers per group advancing to knockout' })
  @IsOptional()
  @IsInt()
  @Min(1)
  qualifiersPerGroup?: number
}
