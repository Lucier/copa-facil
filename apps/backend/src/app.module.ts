import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import type { IncomingMessage } from 'http'
import { randomUUID } from 'crypto'
import { databaseConfig, jwtConfig, redisConfig, validateEnv } from './config'
import { DrizzleModule } from './database/drizzle.module'
import { EventsModule } from './events/events.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { AllExceptionsFilter } from './infrastructure/filters/http-exception.filter'
import { TenantInterceptor } from './infrastructure/interceptors/tenant.interceptor'
import { JobsModule } from './jobs/jobs.module'
import { AuthModule } from './modules/auth/auth.module'
import { ChampionshipsModule } from './modules/championships/championships.module'
import { HealthModule } from './modules/health/health.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { CmsModule } from './modules/cms/cms.module'
import { MatchEngineModule } from './modules/match-engine/match-engine.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { RegistrationsModule } from './modules/registrations/registrations.module'
import { TeamsModule } from './modules/teams/teams.module'
import { WebsocketsModule } from './websockets/websockets.module'
import { PublicApiModule } from './modules/public-api/public-api.module'
import { UploadModule } from './modules/upload/upload.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [databaseConfig, redisConfig, jwtConfig],
    }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 120 },
    ]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') !== 'production'
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            genReqId: (req: IncomingMessage, res) => {
              const existing = (req.headers as Record<string, string>)['x-request-id']
              const id = existing ?? randomUUID()
              ;(res as { setHeader: (k: string, v: string) => void }).setHeader('x-request-id', id)
              return id
            },
            customProps: (req: IncomingMessage) => ({
              tenantId: (req.headers as Record<string, string>)['x-tenant-id'],
            }),
            serializers: {
              req: (req: { method: string; url: string; id: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
            },
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
                }
              : undefined,
          },
        }
      },
    }),
    DrizzleModule,
    InfrastructureModule,
    EventsModule,
    JobsModule,
    WebsocketsModule,
    AuthModule,
    ChampionshipsModule,
    TeamsModule,
    MatchEngineModule,
    CmsModule,
    RegistrationsModule,
    PaymentsModule,
    OrganizationsModule,
    HealthModule,
    PublicApiModule,
    UploadModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
