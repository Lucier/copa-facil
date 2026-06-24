import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

interface EncryptedEnvelope {
  __encrypted__: true
  v: 1
  iv: string
  ct: string
  tag: string
}

function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).__encrypted__ === true
  )
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name)
  private readonly key: Buffer

  constructor(config: ConfigService) {
    const hex = config.get<string>('ENCRYPTION_KEY') ?? ''
    if (hex.length === 64) {
      this.key = Buffer.from(hex, 'hex')
    } else {
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
      }
      // Dev/test fallback — zero key — never used in production
      this.logger.warn('ENCRYPTION_KEY not set — using insecure zero key (dev only)')
      this.key = Buffer.alloc(32, 0)
    }
  }

  encryptJson(payload: Record<string, unknown>): EncryptedEnvelope {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const plaintext = JSON.stringify(payload)
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return {
      __encrypted__: true,
      v: 1,
      iv: iv.toString('hex'),
      ct: ct.toString('hex'),
      tag: tag.toString('hex'),
    }
  }

  decryptJson(envelope: EncryptedEnvelope): Record<string, unknown> {
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(envelope.iv, 'hex'))
    decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'))
    const plaintext = decipher.update(envelope.ct, 'hex', 'utf8') + decipher.final('utf8')
    return JSON.parse(plaintext) as Record<string, unknown>
  }

  // Transparently decrypt if encrypted, return as-is otherwise (backward compat)
  maybeDecrypt(value: Record<string, unknown>): Record<string, unknown> {
    return isEncryptedEnvelope(value) ? this.decryptJson(value) : value
  }

  static isEncrypted(value: unknown): value is EncryptedEnvelope {
    return isEncryptedEnvelope(value)
  }
}
