import { Injectable, Logger } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'
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

function shortId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

@Injectable()
export class MockPaymentGatewayAdapter implements IPaymentGateway {
  private readonly logger = new Logger(MockPaymentGatewayAdapter.name)
  async createPix(req: PixPaymentRequest): Promise<PixPaymentResponse> {
    const transactionId = `MOCK-PIX-${shortId()}`
    const ttl = req.ttlMinutes ?? 30
    const expiresAt = new Date(Date.now() + ttl * 60_000)

    return {
      transactionId,
      qrCode: `data:image/png;base64,MOCK_QR_CODE_${transactionId}`,
      copyPasteCode: `00020126580014BR.GOV.BCB.PIX0136mock-key-${transactionId}5204000053039865802BR5913Copa Facil SAS6009SAO PAULO62140510${transactionId}63041234`,
      expiresAt,
    }
  }

  async createBoleto(req: BoletoPaymentRequest): Promise<BoletoPaymentResponse> {
    const transactionId = `MOCK-BOL-${shortId()}`
    const amountStr = String(req.amount).padStart(10, '0')

    return {
      transactionId,
      barcodeString: `23793.38128 60007.827136 97000.063305 8 000000${amountStr}`,
      pdfUrl: `https://mock-gateway.example.com/boletos/${transactionId}.pdf`,
      dueDate: req.dueDate,
    }
  }

  async chargeCreditCard(_req: CreditCardPaymentRequest): Promise<CreditCardPaymentResponse> {
    return {
      transactionId: `MOCK-CC-${shortId()}`,
      authorizationCode: `AUTH-${shortId()}`,
      capturedAt: new Date(),
    }
  }

  async refund(_req: RefundRequest): Promise<RefundResponse> {
    return {
      refundId: `REFUND-${shortId()}`,
      refundedAt: new Date(),
    }
  }

  async fetchPaymentStatus(_gatewayTransactionId: string): Promise<string> {
    return 'approved'
  }

  /**
   * Verifica assinatura HMAC-SHA256 conforme protocolo Mercado Pago.
   *
   * Formato do header x-signature: ts=<timestamp>,v1=<hmac_hex>
   * Manifesto:  id:<dataId>;request-id:<xRequestId>;ts:<timestamp>
   * HMAC:       HMAC-SHA256(key=MP_WEBHOOK_SECRET, data=manifesto)
   *
   * Se MP_WEBHOOK_SECRET não estiver configurado em ambiente não-produção,
   * loga aviso e permite a requisição para facilitar desenvolvimento local.
   */
  verifyWebhookSignature(
    _payload: Buffer,
    xSignature: string,
    xRequestId?: string,
    dataId?: string,
  ): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET

    if (!secret) {
      if (process.env.NODE_ENV === 'production') return false
      this.logger.warn('MP_WEBHOOK_SECRET not set — skipping signature check (dev only)')
      return true
    }

    if (!xSignature) return false

    // Parse "ts=<timestamp>,v1=<hmac>"
    const parts = new Map(
      xSignature.split(',').map((part) => {
        const idx = part.indexOf('=')
        return [part.slice(0, idx), part.slice(idx + 1)] as [string, string]
      }),
    )
    const ts = parts.get('ts')
    const v1 = parts.get('v1')

    if (!ts || !v1) return false

    // Canonical manifest — matches MercadoPagoPaymentGatewayAdapter exactly
    const manifest = `id:${dataId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`

    const expected = createHmac('sha256', secret).update(manifest).digest('hex')

    // Constant-time comparison to prevent timing attacks
    try {
      const expectedBuf = Buffer.from(expected, 'hex')
      const receivedBuf = Buffer.from(v1, 'hex')
      if (expectedBuf.length !== receivedBuf.length) return false
      return timingSafeEqual(expectedBuf, receivedBuf)
    } catch {
      return false
    }
  }
}
