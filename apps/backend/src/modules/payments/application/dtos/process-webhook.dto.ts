import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export enum WebhookEventType {
  PAYMENT_PAID = 'payment.paid',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
}

export class ProcessWebhookDto {
  @ApiProperty({ description: 'Gateway transaction ID from the external provider' })
  @IsString()
  gatewayTransactionId!: string

  @ApiProperty({ enum: WebhookEventType })
  @IsEnum(WebhookEventType)
  event!: WebhookEventType

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metadata?: string
}
