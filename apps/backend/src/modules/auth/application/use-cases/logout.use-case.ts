import { Inject, Injectable } from '@nestjs/common'
import { IAuditRepository } from '../../domain/repositories/i-audit.repository'
import { AUDIT_REPOSITORY } from '../../domain/repositories/i-audit.repository'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'
import { JwtPayload } from '../jwt-payload.interface'

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly tokenStore: RedisTokenStoreService,
    @Inject(AUDIT_REPOSITORY) private readonly auditRepo: IAuditRepository,
  ) {}

  async execute(payload: JwtPayload): Promise<void> {
    if (payload.jti && payload.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000)
      if (ttl > 0) {
        await this.tokenStore.blockAccessToken(payload.jti, ttl)
      }
    }

    await this.tokenStore.revokeRefreshToken(payload.sub)

    await this.auditRepo.log({
      userId: payload.sub,
      action: 'auth.logout',
    }).catch(() => void 0)
  }
}
