import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSuspensionDto {
  @ApiProperty() @IsUUID() playerId!: string
  @ApiProperty() @IsUUID() teamId!: string
  @ApiProperty() @IsString() reason!: string
  @ApiProperty({ default: 1 }) @IsInt() @Min(1) matchesToServe: number = 1
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string
}
