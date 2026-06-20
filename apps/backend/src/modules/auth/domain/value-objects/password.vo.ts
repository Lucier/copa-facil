import { ValueObject } from '../../../../shared/domain/value-object'
import { ValidationError } from '../../../../shared/errors'

export class Password extends ValueObject<string> {
  private readonly _hashed: boolean

  private constructor(value: string, hashed: boolean) {
    super(value)
    this._hashed = hashed
  }

  static createRaw(value: string): Password {
    if (value.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(value)) {
      throw new ValidationError('Password must contain at least one uppercase letter')
    }
    if (!/[0-9]/.test(value)) {
      throw new ValidationError('Password must contain at least one number')
    }
    return new Password(value, false)
  }

  static fromHash(hash: string): Password {
    return new Password(hash, true)
  }

  isHashed(): boolean {
    return this._hashed
  }

  get raw(): string {
    return this.getValue()
  }
}
