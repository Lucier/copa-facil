import { Global, Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { CryptService } from './crypt/crypt.service'
import { AppLoggerService } from './logging/app-logger.service'
import { redisProvider } from './redis/redis.provider'
import { RedisLifecycleService } from './redis/redis-lifecycle.service'
import { REDIS_CLIENT } from './redis/redis.constants'
import { StorageService } from './storage/storage.service'
import { TenantInterceptor } from './interceptors/tenant.interceptor'

@Global()
@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [
    CryptService,
    AppLoggerService,
    StorageService,
    TenantInterceptor,
    redisProvider,
    RedisLifecycleService,
  ],
  exports: [
    CryptService,
    AppLoggerService,
    StorageService,
    HttpModule,
    REDIS_CLIENT,
  ],
})
export class InfrastructureModule {}
