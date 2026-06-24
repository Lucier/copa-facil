import {
  Body, Controller, Headers, HttpCode, HttpStatus, Inject,
  Logger, Param, Post, Query, RawBodyRequest, Req,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ProcessWebhookDto } from '../../application/dtos/process-webhook.dto'
import { ProcessWebhookUseCase } from '../../application/use-cases/process-webhook.use-case'
import { IPaymentGateway, PAYMENT_GATEWAY } from '../../domain/gateways/i-payment-gateway'

@ApiTags('Payments — Webhooks')
@Controller('webhooks/payments')
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name)

  constructor(
    private readonly processWebhook: ProcessWebhookUseCase,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Payment provider webhook callback (public). tenantId query param resolves the schema.',
  })
  async handle(
    @Param('provider') provider: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: ProcessWebhookDto,
    @Headers('x-payment-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    const rawPayload = req.rawBody ?? Buffer.from(JSON.stringify(dto))
    const sig = signature ?? ''

    // Validate signature at the entry point before any business logic runs.
    // Returning 200 on invalid sigs prevents infinite retries from providers.
    if (!this.gateway.verifyWebhookSignature(rawPayload, sig)) {
      this.logger.warn({ provider, tenantId }, 'Webhook rejected — invalid signature')
      return
    }

    const tenantSchema = `tenant_${tenantId}`
    await this.processWebhook.execute(dto, tenantSchema, rawPayload, sig)
  }
}
