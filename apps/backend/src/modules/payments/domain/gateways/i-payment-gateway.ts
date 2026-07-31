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

export interface CheckoutProItem {
  id: string
  title: string
  description?: string
  quantity: number
  unitPrice: number
}

export interface CheckoutProBackUrls {
  success: string
  failure: string
  pending: string
}

export interface CheckoutProRequest {
  items: CheckoutProItem[]
  payer?: { email?: string; lastName?: string }
  backUrls: CheckoutProBackUrls
  notificationUrl: string
  externalReference: string
  statementDescriptor?: string
  binaryMode?: boolean
  maxInstallments?: number
  excludedPaymentMethods?: string[]
  excludedPaymentTypes?: string[]
  expiresAt?: Date
}

export interface CheckoutProResponse {
  preferenceId: string
  initPoint: string
  sandboxInitPoint: string
}

export interface PaymentDetails {
  status: string
  externalReference?: string
}

export interface IPaymentGateway {
  createPix(req: PixPaymentRequest): Promise<PixPaymentResponse>
  createBoleto(req: BoletoPaymentRequest): Promise<BoletoPaymentResponse>
  chargeCreditCard(req: CreditCardPaymentRequest): Promise<CreditCardPaymentResponse>
  createCheckoutProPreference(req: CheckoutProRequest): Promise<CheckoutProResponse>
  refund(req: RefundRequest): Promise<RefundResponse>
  fetchPaymentDetails(gatewayTransactionId: string): Promise<PaymentDetails>
  verifyWebhookSignature(
    payload: Buffer,
    xSignature: string,
    xRequestId?: string,
    dataId?: string,
  ): boolean
}
