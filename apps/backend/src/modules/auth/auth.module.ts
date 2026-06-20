import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { DrizzleModule } from '../../database/drizzle.module'
import { AUDIT_REPOSITORY } from './domain/repositories/i-audit.repository'
import { MEMBERSHIP_REPOSITORY } from './domain/repositories/i-membership.repository'
import { ORGANIZATION_REPOSITORY } from './domain/repositories/i-organization.repository'
import { USER_REPOSITORY } from './domain/repositories/i-user.repository'
import { UserMapper } from './application/mappers/user.mapper'
import { TenantMemberMapper } from './application/mappers/tenant-member.mapper'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { LogoutUseCase } from './application/use-cases/logout.use-case'
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case'
import { RegisterUseCase } from './application/use-cases/register.use-case'
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case'
import { DrizzleAuditRepository } from './infrastructure/repositories/drizzle-audit.repository'
import { DrizzleMembershipRepository } from './infrastructure/repositories/drizzle-membership.repository'
import { DrizzleOrganizationRepository } from './infrastructure/repositories/drizzle-organization.repository'
import { DrizzleUserRepository } from './infrastructure/repositories/drizzle-user.repository'
import { RedisTokenStoreService } from './infrastructure/services/redis-token-store.service'
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy'
import { RefreshTokenStrategy } from './infrastructure/strategies/refresh-token.strategy'
import { AuthController } from './presentation/controllers/auth.controller'
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from './presentation/guards/tenant-roles.guard'

@Module({
  imports: [
    DrizzleModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') as any },
      }),
    }),
  ],
  providers: [
    // Repository bindings
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: DrizzleMembershipRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: DrizzleOrganizationRepository },
    { provide: AUDIT_REPOSITORY, useClass: DrizzleAuditRepository },
    // Mappers
    UserMapper,
    TenantMemberMapper,
    // Use cases
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ResetPasswordUseCase,
    // Infrastructure
    JwtStrategy,
    RefreshTokenStrategy,
    RedisTokenStoreService,
    // Guards
    JwtAuthGuard,
    TenantRolesGuard,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, TenantRolesGuard, JwtModule, RedisTokenStoreService],
})
export class AuthModule {}
