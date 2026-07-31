import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { IncomeCategory } from '../../domain/enums'

export class CheckoutProItemDto {
  @ApiProperty()
  @IsString()
  id!: string

  @ApiProperty()
  @IsString()
  title!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Quantity of this item' })
  @IsInt()
  @Min(1)
  quantity!: number

  @ApiProperty({ description: 'Unit price in cents (e.g. 5000 = R$50,00)' })
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  unitPrice!: number
}

export class CheckoutProBackUrlsDto {
  @ApiProperty({ description: 'URL to redirect after successful payment' })
  @IsString()
  success!: string

  @ApiProperty({ description: 'URL to redirect after failed payment' })
  @IsString()
  failure!: string

  @ApiProperty({ description: 'URL to redirect for pending payment' })
  @IsString()
  pending!: string
}

export class CreateCheckoutProDto {
  @ApiProperty({ type: [CheckoutProItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutProItemDto)
  items!: CheckoutProItemDto[]

  @ApiProperty({ type: CheckoutProBackUrlsDto })
  @ValidateNested()
  @Type(() => CheckoutProBackUrlsDto)
  backUrls!: CheckoutProBackUrlsDto

  @ApiProperty({ enum: IncomeCategory })
  @IsEnum(IncomeCategory)
  category!: IncomeCategory

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  championshipId?: string

  @ApiPropertyOptional({ description: 'Internal reference ID (e.g. registration ID)' })
  @IsOptional()
  @IsString()
  referenceId?: string

  @ApiPropertyOptional({ description: 'Internal reference type (e.g. "registration")' })
  @IsOptional()
  @IsString()
  referenceType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerLastName?: string

  @ApiPropertyOptional({ description: 'Text shown on card statement (max 22 chars)' })
  @IsOptional()
  @IsString()
  statementDescriptor?: string

  @ApiPropertyOptional({ description: 'Require instant payment approval (no in_process status)' })
  @IsOptional()
  @IsBoolean()
  binaryMode?: boolean

  @ApiPropertyOptional({ description: 'Maximum number of installments to offer' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  maxInstallments?: number

  @ApiPropertyOptional({ description: 'Payment method IDs to exclude (e.g. ["amex"])' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedPaymentMethods?: string[]

  @ApiPropertyOptional({ description: 'Payment type IDs to exclude (e.g. ["debit_card"])' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedPaymentTypes?: string[]

  @ApiPropertyOptional({ description: 'Preference expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string
}
