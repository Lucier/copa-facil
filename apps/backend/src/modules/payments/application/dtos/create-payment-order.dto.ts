import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator'
import { IncomeCategory, PaymentMethodType } from '../../domain/enums'

export class CreatePaymentOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiPropertyOptional({ description: 'e.g., registration ID' })
  @IsOptional()
  @IsString()
  referenceId?: string

  @ApiPropertyOptional({ description: 'e.g., "registration", "sponsorship"' })
  @IsOptional()
  @IsString()
  referenceType?: string

  @ApiProperty({ description: 'Amount in cents (e.g., 10000 = R$100,00). Max: R$1.000.000,00' })
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  amount!: number

  @ApiProperty({ enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  method!: PaymentMethodType

  @ApiProperty({ enum: IncomeCategory })
  @IsEnum(IncomeCategory)
  category!: IncomeCategory

  @ApiProperty()
  @IsString()
  description!: string

  // PIX fields
  @ApiPropertyOptional({ description: 'PIX TTL in minutes (default: 30)' })
  @ValidateIf((o) => o.method === PaymentMethodType.PIX)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  ttlMinutes?: number

  // Shared optional payer info
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerEmail?: string

  // Boleto fields
  @ApiPropertyOptional()
  @ValidateIf((o) => o.method === PaymentMethodType.BOLETO)
  @IsString()
  payerName?: string

  @ApiPropertyOptional()
  @ValidateIf((o) => o.method === PaymentMethodType.BOLETO)
  @IsString()
  payerDocument?: string

  @ApiPropertyOptional()
  @ValidateIf((o) => o.method === PaymentMethodType.BOLETO)
  @IsDateString()
  dueDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerZipCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerStreetName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerCity?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerState?: string

  // Credit card fields
  @ApiPropertyOptional()
  @ValidateIf((o) => o.method === PaymentMethodType.CARTAO_CREDITO)
  @IsString()
  cardToken?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  installments?: number

  @ApiPropertyOptional({ description: 'MP payment_method_id for credit card (e.g., "visa", "master")' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string

  @ApiPropertyOptional({ description: 'MP issuer_id for credit card' })
  @IsOptional()
  @IsString()
  issuerId?: string
}
