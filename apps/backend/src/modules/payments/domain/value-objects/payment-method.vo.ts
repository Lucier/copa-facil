import { PaymentMethodType } from '../enums'

export class PaymentMethod {
  constructor(public readonly type: PaymentMethodType) {
    if (!Object.values(PaymentMethodType).includes(type)) {
      throw new Error(`Invalid payment method type: ${type}`)
    }
  }

  isPix(): boolean { return this.type === PaymentMethodType.PIX }
  isBoleto(): boolean { return this.type === PaymentMethodType.BOLETO }
  isCreditCard(): boolean { return this.type === PaymentMethodType.CARTAO_CREDITO }
}
