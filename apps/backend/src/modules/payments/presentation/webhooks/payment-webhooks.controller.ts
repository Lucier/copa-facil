import {
  Body, Controller, Headers, HttpCode, HttpStatus, Param, Post, Query, RawBodyRequest, Req,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ProcessWebhookDto } from '../../application/dtos/process-webhook.dto'
import { ProcessWebhookUseCase } from '../../application/use-cases/process-webhook.use-case'

@ApiTags('Payments — Webhooks')
@Controller('webhooks/payments')
export class PaymentWebhooksController {
  constructor(private readonly processWebhook: ProcessWebhookUseCase) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Payment provider webhook callback (public). tenantId query param resolves the schema.',
  })
  async handle(
    @Param('provider') _provider: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: ProcessWebhookDto,
    @Headers('x-payment-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    const tenantSchema = `tenant_${tenantId}`
    const rawPayload = req.rawBody ?? Buffer.from(JSON.stringify(dto))
    await this.processWebhook.execute(dto, tenantSchema, rawPayload, signature ?? '')
  }
}
