import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user.repository'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'
import { JwtPayload } from '../jwt-payload.interface'
import { TokenOutputDto } from '../dtos/token-output.dto'
import { UserMapper } from '../mappers/user.mapper'
import { LoginUseCase } from './login.use-case'

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly tokenStore: RedisTokenStoreService,
    private readonly loginUseCase: LoginUseCase,
    private readonly config: ConfigService,
  ) {}

  async execute(refreshToken: string): Promise<TokenOutputDto> {
    let payload: JwtPayload
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const storedJti = await this.tokenStore.getRefreshToken(payload.sub)
    if (!storedJti || storedJti !== payload.jti) {
      throw new UnauthorizedException('Refresh token has been revoked')
    }

    const user = await this.userRepo.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive')
    }

    await this.tokenStore.revokeRefreshToken(payload.sub)

    const tokens = await this.loginUseCase.issueTokenPair(
      user.id,
      user.email,
      payload.tenantSchema,
      payload.role,
    )
    tokens.user = UserMapper.toDto(user)
    return tokens
  }
}
