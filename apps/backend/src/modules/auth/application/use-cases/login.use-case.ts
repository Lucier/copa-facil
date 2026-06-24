import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'
import { CryptService } from '../../../../infrastructure/crypt/crypt.service'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { AUDIT_REPOSITORY, IAuditRepository } from '../../domain/repositories/i-audit.repository'
import {
  IMembershipRepository,
  MEMBERSHIP_REPOSITORY,
} from '../../domain/repositories/i-membership.repository'
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/i-user.repository'
import { UserMapper } from '../mappers/user.mapper'
import { LoginInputDto } from '../dtos/login-input.dto'
import { TokenOutputDto } from '../dtos/token-output.dto'
import { JwtPayload } from '../jwt-payload.interface'
import { RedisTokenStoreService } from '../../infrastructure/services/redis-token-store.service'

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: IMembershipRepository,
    @Inject(AUDIT_REPOSITORY) private readonly auditRepo: IAuditRepository,
    private readonly crypt: CryptService,
    private readonly jwtService: JwtService,
    private readonly tokenStore: RedisTokenStoreService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: LoginInputDto): Promise<TokenOutputDto> {
    const user = await this.userRepo.findByEmail(dto.email)
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials')

    const passwordValid = await this.crypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials')

    const tenantSchema = TenantContext.getSchema()
    let role: string | undefined

    if (tenantSchema !== 'public') {
      const member = await this.membershipRepo.findByUserId(user.id)
      if (!member || !member.isActive) {
        throw new UnauthorizedException('User is not a member of this organization')
      }
      role = member.role
    }

    const tokens = await this.issueTokenPair(user.id, user.email, tenantSchema, role)

    this.auditRepo
      .log({ userId: user.id, action: 'auth.login', metadata: { tenantSchema } })
      .catch(() => void 0)

    tokens.user = UserMapper.toDto(user)
    return tokens
  }

  async issueTokenPair(
    userId: string,
    email: string,
    tenantSchema?: string,
    role?: string,
  ): Promise<TokenOutputDto> {
    const accessJti = randomUUID()
    const refreshJti = randomUUID()

    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      jti: accessJti,
      ...(tenantSchema && tenantSchema !== 'public' ? { tenantSchema } : {}),
      ...(role ? { role } : {}),
    }

    const refreshPayload: JwtPayload = { sub: userId, email, jti: refreshJti }

    const accessExpiresIn = this.config.get<string>('jwt.expiresIn') ?? '15m'
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d'

    const accessToken = this.jwtService.sign(
      { ...accessPayload },
      { expiresIn: this.parseTtlToSeconds(accessExpiresIn) },
    )
    const refreshToken = this.jwtService.sign(
      { ...refreshPayload },
      {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.parseTtlToSeconds(refreshExpiresIn),
      },
    )

    const refreshTtl = this.parseTtlToSeconds(refreshExpiresIn)
    await this.tokenStore.storeRefreshToken(userId, refreshJti, refreshTtl)

    const output = new TokenOutputDto()
    output.accessToken = accessToken
    output.refreshToken = refreshToken
    output.expiresIn = this.parseTtlToSeconds(accessExpiresIn)
    return output
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl)
    if (!match) return 900
    const n = parseInt(match[1], 10)
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
    return n * (multipliers[match[2]] ?? 1)
  }
}
