import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { CryptService } from '../../../../infrastructure/crypt/crypt.service'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user.repository'
import { Password } from '../../domain/value-objects/password.vo'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'
import { ResetPasswordConfirmDto } from '../dtos/reset-password-confirm.dto'
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly tokenStore: RedisTokenStoreService,
    private readonly crypt: CryptService,
  ) {}

  // Always returns success to prevent user enumeration
  async requestReset(dto: ResetPasswordRequestDto): Promise<void> {
    const user = await this.userRepo.findByEmail(dto.email)
    if (!user) return

    const token = randomBytes(32).toString('hex')
    await this.tokenStore.storeResetToken(token, user.id)

    // TODO: dispatch email via NotificationsModule
    // The reset link would be: /auth/reset-password/confirm?token={token}
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
  }
}
