import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtPayload } from '../../application/jwt-payload.interface'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tokenStore: RedisTokenStoreService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = (await super.canActivate(context)) as boolean
    if (!isValid) return false

    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>()
    const user = req.user

    if (user.jti && (await this.tokenStore.isBlocked(user.jti))) {
      throw new UnauthorizedException('Token has been revoked')
    }
    return true
  }
}
