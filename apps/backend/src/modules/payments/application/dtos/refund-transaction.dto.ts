import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class RefundTransactionDto {
  @ApiPropertyOptional({ description: 'Partial refund amount in cents. Omit for full refund.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  amount?: number
}
