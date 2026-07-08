import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import { CryptService } from '../../../../infrastructure/crypt/crypt.service'
import { MailService } from '../../../../infrastructure/mail/mail.service'
import { IAuditRepository } from '../../domain/repositories/i-audit.repository'
import { AUDIT_REPOSITORY } from '../../domain/repositories/i-audit.repository'
import { IUserRepository} from '../../domain/repositories/i-user.repository'
import { USER_REPOSITORY } from '../../domain/repositories/i-user.repository'
import { Password } from '../../domain/value-objects/password.vo'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'
import { ResetPasswordConfirmDto } from '../dtos/reset-password-confirm.dto'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    private readonly tokenStore: RedisTokenStoreService,
    private readonly crypt: CryptService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // Always returns success and runs the same work to prevent:
  //   1. User enumeration via response content
  //   2. User enumeration via timing difference (bcrypt hash equalises latency)
  async requestReset(dto: ResetPasswordRequestDto): Promise<void> {
    const token = randomBytes(32).toString('hex')

    const [user] = await Promise.all([
      this.userRepo.findByEmail(dto.email),
      // Dummy hash keeps response time constant whether or not the user exists
      this.crypt.hash(token),
    ])

    if (user) {
      await this.tokenStore.storeResetToken(token, user.id)

      const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000'
      const resetUrl = `${appUrl}/auth/reset-password/confirm?token=${token}`

      await this.mail.sendPasswordReset(user.email, user.name, resetUrl)
    }
  }

  async confirmReset(dto: ResetPasswordConfirmDto): Promise<void> {
    const userId = await this.tokenStore.getResetToken(dto.token)
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    Password.createRaw(dto.newPassword)

    const passwordHash = await this.crypt.hash(dto.newPassword)
    await this.userRepo.updatePassword(userId, passwordHash)
    await this.tokenStore.deleteResetToken(dto.token)

    await this.audit.log({
      userId,
      action: 'auth.password_reset',
      resource: 'user',
      resourceId: userId,
    })
  }
}
