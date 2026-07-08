import { createHmac, timingSafeEqual } from 'crypto'
import { BadRequestException } from '@nestjs/common'
import { MercadoPagoConfig} from 'mercadopago'
import { Payment, PaymentRefund } from 'mercadopago'
import {
  BoletoPaymentRequest,
  BoletoPaymentResponse,
  CreditCardPaymentRequest,
  CreditCardPaymentResponse,
  IPaymentGateway,
  PixPaymentRequest,
  PixPaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../../domain/gateways/i-payment-gateway'

export class MercadoPagoPaymentGatewayAdapter implements IPaymentGateway {
  private readonly paymentClient: Payment
  private readonly refundClient: PaymentRefund

  constructor(
    mpConfig: MercadoPagoConfig,
    private readonly webhookSecret?: string,
  ) {
    this.paymentClient = new Payment(mpConfig)
    this.refundClient = new PaymentRefund(mpConfig)
  }

  async createPix(req: PixPaymentRequest): Promise<PixPaymentResponse> {
    if (!req.payerEmail) throw new BadRequestException('payerEmail is required for PIX payments')
    const ttl = req.ttlMinutes ?? 30
    const expiresAt = new Date(Date.now() + ttl * 60_000)

    const response = await this.paymentClient.create({
      body: {
        transaction_amount: req.amount / 100,
        description: req.description,
        payment_method_id: 'pix',
        date_of_expiration: expiresAt.toISOString(),
        payer: { email: req.payerEmail },
      },
    })

    const txData = response.point_of_interaction?.transaction_data
    return {
      transactionId: String(response.id),
      qrCode: txData?.qr_code_base64 ?? '',
      copyPasteCode: txData?.qr_code ?? '',
      expiresAt: response.date_of_expiration ? new Date(response.date_of_expiration) : expiresAt,
    }
  }

  async createBoleto(req: BoletoPaymentRequest): Promise<BoletoPaymentResponse> {
    if (!req.payerEmail) throw new BadRequestException('payerEmail is required for Boleto payments')
    if (!req.payerZipCode || !req.payerStreetName || !req.payerCity || !req.payerState) {
      throw new BadRequestException(
        'payerZipCode, payerStreetName, payerCity and payerState are required for Boleto payments',
      )
    }
    const nameParts = req.payerName.split(' ')
    const response = await this.paymentClient.create({
      body: {
        transaction_amount: req.amount / 100,
        description: req.description,
        payment_method_id: 'bolbradesco',
        date_of_expiration: req.dueDate.toISOString(),
        payer: {
          email: req.payerEmail,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || nameParts[0],
          identification: {
            type: req.payerDocument.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
            number: req.payerDocument.replace(/\D/g, ''),
          },
          address: {
            zip_code: req.payerZipCode,
            street_name: req.payerStreetName,
            city: req.payerCity,
            federal_unit: req.payerState,
          },
        },
      },
    })

    return {
      transactionId: String(response.id),
      barcodeString: response.transaction_details?.barcode?.content ?? response.transaction_details?.digitable_line ?? '',
      pdfUrl: response.transaction_details?.external_resource_url ?? '',
      dueDate: response.date_of_expiration ? new Date(response.date_of_expiration) : req.dueDate,
    }
  }

  async chargeCreditCard(req: CreditCardPaymentRequest): Promise<CreditCardPaymentResponse> {
    if (!req.payerEmail) throw new BadRequestException('payerEmail is required for credit card payments')
    const response = await this.paymentClient.create({
      body: {
        transaction_amount: req.amount / 100,
        description: req.description,
        token: req.cardToken,
        installments: req.installments ?? 1,
        payment_method_id: req.paymentMethodId,
        issuer_id: req.issuerId ? Number(req.issuerId) : undefined,
        three_d_secure_mode: 'optional' as const,
        payer: { email: req.payerEmail },
      },
    })

    return {
      transactionId: String(response.id),
      authorizationCode: response.authorization_code ?? '',
      capturedAt: response.date_approved ? new Date(response.date_approved) : new Date(),
    }
  }

  async refund(req: RefundRequest): Promise<RefundResponse> {
    const refund = await this.refundClient.create({
      payment_id: Number(req.gatewayTransactionId),
      body: req.amount !== undefined ? { amount: req.amount / 100 } : {},
    })

    return {
      refundId: String(refund.id),
      refundedAt: refund.date_created ? new Date(refund.date_created) : new Date(),
    }
  }

  async fetchPaymentStatus(gatewayTransactionId: string): Promise<string> {
    const response = await this.paymentClient.get({ id: gatewayTransactionId })
    return this.normalizeStatus(response.status ?? 'pending')
  }

  verifyWebhookSignature(
    _payload: Buffer,
    xSignature: string,
    xRequestId?: string,
    dataId?: string,
  ): boolean {
    if (!this.webhookSecret || !xSignature) return false

    // X-Signature format: "ts=<timestamp>,v1=<hmac>"
    const parts = new Map(
      xSignature.split(',').map((part) => {
        const idx = part.indexOf('=')
        return [part.slice(0, idx), part.slice(idx + 1)] as [string, string]
      }),
    )
    const ts = parts.get('ts')
    const v1 = parts.get('v1')
    if (!ts || !v1) return false

    // Reject events older than 5 minutes to prevent replay attacks
    const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(ts, 10)
    if (isNaN(ageSeconds) || ageSeconds < 0 || ageSeconds > 300) return false

    const manifest = `id:${dataId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`
    const computed = createHmac('sha256', this.webhookSecret).update(manifest).digest('hex')
    const computedBuf = Buffer.from(computed)
    const v1Buf = Buffer.from(v1)
    return computedBuf.length === v1Buf.length && timingSafeEqual(computedBuf, v1Buf)
  }

  private normalizeStatus(status: string): string {
    switch (status) {
      case 'approved': return 'approved'
      case 'rejected': return 'rejected'
      case 'cancelled': return 'cancelled'
      case 'refunded': return 'refunded'
      default: return 'pending'
    }
  }
}
