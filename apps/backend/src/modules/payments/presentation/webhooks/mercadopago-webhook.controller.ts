import {
  RawBodyRequest} from '@nestjs/common'
import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ProcessWebhookDto} from '../../application/dtos/process-webhook.dto'
import { WebhookEventType } from '../../application/dtos/process-webhook.dto'
import { ProcessWebhookUseCase } from '../../application/use-cases/process-webhook.use-case'
import { IPaymentGateway} from '../../domain/gateways/i-payment-gateway'
import { PAYMENT_GATEWAY } from '../../domain/gateways/i-payment-gateway'

interface MpWebhookBody {
  type?: string
  action?: string
  data?: { id?: string | number }
}

@ApiTags('Payments — Webhooks')
@Controller('webhooks/mercadopago')
export class MercadoPagoWebhookController {
  private readonly logger = new Logger(MercadoPagoWebhookController.name)

  constructor(
    private readonly processWebhook: ProcessWebhookUseCase,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mercado Pago native webhook (public). tenantId query param resolves the schema.',
  })
  async handle(
    @Query('tenantId') tenantId: string,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    const body = req.body as MpWebhookBody
    const dataId = String(body?.data?.id ?? '')
    const rawPayload = req.rawBody ?? Buffer.from(JSON.stringify(body))

    if (!this.gateway.verifyWebhookSignature(rawPayload, xSignature ?? '', xRequestId, dataId)) {
      this.logger.warn({ dataId, xRequestId }, 'MP webhook signature invalid — ignoring')
      return
    }

    if (body?.type !== 'payment' || !dataId) {
      return
    }

    let status: string
    try {
      status = await this.gateway.fetchPaymentStatus(dataId)
    } catch (err) {
      this.logger.error({ dataId }, `Failed to fetch payment status: ${String(err)}`)
      return
    }

    const event = this.mapStatus(status)
    if (!event) return

    const dto: ProcessWebhookDto = { gatewayTransactionId: dataId, event }
    const tenantSchema = `tenant_${tenantId}`

    try {
      await this.processWebhook.execute(dto, tenantSchema, rawPayload, xSignature ?? '', xRequestId, dataId)
    } catch (err) {
      this.logger.error({ dataId, tenantId }, `Webhook processing failed: ${String(err)}`)
    }
  }

  private mapStatus(status: string): WebhookEventType | null {
    switch (status) {
      case 'approved': return WebhookEventType.PAYMENT_PAID
      case 'rejected':
      case 'cancelled': return WebhookEventType.PAYMENT_FAILED
      case 'refunded': return WebhookEventType.PAYMENT_REFUNDED
      default: return null
    }
  }
}
