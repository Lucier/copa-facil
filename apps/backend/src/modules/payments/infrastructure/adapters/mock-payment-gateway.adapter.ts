import { Injectable } from '@nestjs/common'
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
  async createPix(req: PixPaymentRequest): Promise<PixPaymentResponse> {
    const transactionId = `MOCK-PIX-${shortId()}`
    const ttl = req.ttlMinutes ?? 30
    const expiresAt = new Date(Date.now() + ttl * 60_000)

    return {
      transactionId,
      qrCode: `data:image/png;base64,MOCK_QR_CODE_${transactionId}`,
      copyPasteCode: `00020126580014BR.GOV.BCB.PIX0136mock-key-${transactionId}5204000053039865802BR5925Copa Facil Organizacoes6009SAO PAULO62140510${transactionId}63041234`,
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

  async chargeCreditCard(req: CreditCardPaymentRequest): Promise<CreditCardPaymentResponse> {
    return {
      transactionId: `MOCK-CC-${shortId()}`,
      authorizationCode: `AUTH-${shortId()}`,
      capturedAt: new Date(),
    }
  }

  async refund(req: RefundRequest): Promise<RefundResponse> {
    return {
      refundId: `REFUND-${shortId()}`,
      refundedAt: new Date(),
    }
  }

  async fetchPaymentStatus(_gatewayTransactionId: string): Promise<string> {
    return 'approved'
  }

  verifyWebhookSignature(
    _payload: Buffer,
    _xSignature: string,
    _xRequestId?: string,
    _dataId?: string,
  ): boolean {
    return true
  }
}
