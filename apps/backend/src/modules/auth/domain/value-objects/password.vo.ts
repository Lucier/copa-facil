import { ValueObject } from '../../../../shared/domain/value-object'
import { ValidationError } from '../../../../shared/errors'

// Most common passwords — checked to prevent trivially guessable credentials.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456789', '12345678',
  'qwerty123', 'iloveyou', 'admin123', 'welcome1', 'monkey123',
  'dragon123', 'master123', 'sunshine1', 'princess1', 'football1',
])

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
    if (value.length > 128) {
      throw new ValidationError('Password must be at most 128 characters long')
    }
    if (!/[A-Z]/.test(value)) {
      throw new ValidationError('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(value)) {
      throw new ValidationError('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(value)) {
      throw new ValidationError('Password must contain at least one number')
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      throw new ValidationError('Password must contain at least one special character')
    }
    if (COMMON_PASSWORDS.has(value.toLowerCase())) {
      throw new ValidationError('Password is too common, please choose a stronger password')
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
