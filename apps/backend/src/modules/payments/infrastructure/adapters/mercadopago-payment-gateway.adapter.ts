import { createHmac, timingSafeEqual } from 'crypto'
import { BadRequestException } from '@nestjs/common'
import { MercadoPagoConfig } from 'mercadopago'
import { Payment, PaymentRefund, Preference } from 'mercadopago'
import type { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes'
import {
  BoletoPaymentRequest,
  BoletoPaymentResponse,
  CheckoutProRequest,
  CheckoutProResponse,
  CreditCardPaymentRequest,
  CreditCardPaymentResponse,
  IPaymentGateway,
  PaymentDetails,
  PixPaymentRequest,
  PixPaymentResponse,
  RefundRequest,
  RefundResponse,
} from '../../domain/gateways/i-payment-gateway'

export class MercadoPagoPaymentGatewayAdapter implements IPaymentGateway {
  private readonly paymentClient: Payment
  private readonly refundClient: PaymentRefund
  private readonly preferenceClient: Preference

  constructor(
    mpConfig: MercadoPagoConfig,
    private readonly webhookSecret?: string,
  ) {
    this.paymentClient = new Payment(mpConfig)
    this.refundClient = new PaymentRefund(mpConfig)
    this.preferenceClient = new Preference(mpConfig)
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

  async createCheckoutProPreference(req: CheckoutProRequest): Promise<CheckoutProResponse> {
    const body: PreferenceRequest = {
      items: req.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice / 100,
        currency_id: 'BRL',
      })),
      payer: {
        email: req.payer?.email,
        surname: req.payer?.lastName,
      },
      back_urls: {
        success: req.backUrls.success,
        failure: req.backUrls.failure,
        pending: req.backUrls.pending,
      },
      notification_url: req.notificationUrl,
      external_reference: req.externalReference,
      statement_descriptor: req.statementDescriptor,
      binary_mode: req.binaryMode,
    }

    if (req.maxInstallments !== undefined || req.excludedPaymentMethods?.length || req.excludedPaymentTypes?.length) {
      body.payment_methods = {
        installments: req.maxInstallments,
        excluded_payment_methods: req.excludedPaymentMethods?.map((id) => ({ id })),
        excluded_payment_types: req.excludedPaymentTypes?.map((id) => ({ id })),
      }
    }

    if (req.expiresAt) {
      body.expires = true
      body.expiration_date_to = req.expiresAt.toISOString()
    }

    try {
      const response = await this.preferenceClient.create({ body })
      return {
        preferenceId: response.id ?? '',
        initPoint: response.init_point ?? '',
        sandboxInitPoint: response.sandbox_init_point ?? '',
      }
    } catch (err: unknown) {
      const mp = err as { message?: string; cause?: unknown; status?: number }
      console.error('[MP] createCheckoutProPreference error:', JSON.stringify({ message: mp.message, cause: mp.cause, status: mp.status }, null, 2))
      throw err
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

  async fetchPaymentDetails(gatewayTransactionId: string): Promise<PaymentDetails> {
    const response = await this.paymentClient.get({ id: gatewayTransactionId })
    return {
      status: this.normalizeStatus(response.status ?? 'pending'),
      externalReference: response.external_reference ?? undefined,
    }
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
