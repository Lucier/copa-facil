export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY'

export interface PixPaymentRequest {
  amount: number
  description: string
  payerEmail?: string
  ttlMinutes?: number
}

export interface PixPaymentResponse {
  transactionId: string
  qrCode: string
  copyPasteCode: string
  expiresAt: Date
}

export interface BoletoPaymentRequest {
  amount: number
  description: string
  payerName: string
  payerDocument: string
  payerEmail?: string
  payerZipCode?: string
  payerStreetName?: string
  payerCity?: string
  payerState?: string
  dueDate: Date
}

export interface BoletoPaymentResponse {
  transactionId: string
  barcodeString: string
  pdfUrl: string
  dueDate: Date
}

export interface CreditCardPaymentRequest {
  amount: number
  description: string
  cardToken: string
  installments?: number
  paymentMethodId?: string
  issuerId?: string
  payerEmail?: string
}

export interface CreditCardPaymentResponse {
  transactionId: string
  authorizationCode: string
  capturedAt: Date
}

export interface RefundRequest {
  gatewayTransactionId: string
  amount?: number
}

export interface RefundResponse {
  refundId: string
  refundedAt: Date
}

export interface IPaymentGateway {
  createPix(req: PixPaymentRequest): Promise<PixPaymentResponse>
  createBoleto(req: BoletoPaymentRequest): Promise<BoletoPaymentResponse>
  chargeCreditCard(req: CreditCardPaymentRequest): Promise<CreditCardPaymentResponse>
  refund(req: RefundRequest): Promise<RefundResponse>
  /**
   * Fetches the current status of a payment from the gateway.
   * Returns normalized status: 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'pending'
   */
  fetchPaymentStatus(gatewayTransactionId: string): Promise<string>
  /**
   * Validates the webhook signature sent by the gateway.
   * For Mercado Pago: xSignature = X-Signature header, xRequestId = X-Request-Id, dataId = data.id query param.
   */
  verifyWebhookSignature(
    payload: Buffer,
    xSignature: string,
    xRequestId?: string,
    dataId?: string,
  ): boolean
}
