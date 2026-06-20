import { ValueObject } from '../../../../shared/domain/value-object'
import { ValidationError } from '../../../../shared/errors'

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    super(value)
  }

  static create(raw: string): Email {
    const normalized = raw.toLowerCase().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new ValidationError(`Invalid email address: ${raw}`)
    }
    return new Email(normalized)
  }

  toString(): string {
    return this.getValue()
  }
}
