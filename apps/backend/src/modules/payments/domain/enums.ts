export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethodType {
  PIX = 'pix',
  BOLETO = 'boleto',
  CARTAO_CREDITO = 'cartao_credito',
}

export enum IncomeCategory {
  INSCRICAO = 'inscricao',
  PATROCINIO = 'patrocinio',
  RECEITA_AVULSA = 'receita_avulsa',
}
