import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Min } from 'class-validator'

export class RefundTransactionDto {
  @ApiPropertyOptional({ description: 'Partial refund amount in cents. Omit for full refund.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number
}
