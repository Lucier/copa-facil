import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { CorsIoAdapter } from './infrastructure/websockets/cors-io.adapter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, rawBody: true })

  // Limit request body size to 1 MB to prevent DoS via large payloads
  app.useBodyParser('json', { limit: '1mb' })
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' })

  // Use pino as the NestJS logger (covers framework internals + bootstrap logs)
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigService)
  const isDev = config.get<string>('NODE_ENV') !== 'production'
  const corsOrigins = config
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((o) => o.trim())

  app.useStaticAssets(require('path').resolve(process.cwd(), 'uploads'), { prefix: '/uploads' })

  app.use(cookieParser())
  app.use(helmet())
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-api-key'],
  })

  app.useWebSocketAdapter(new CorsIoAdapter(app, corsOrigins))
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.setGlobalPrefix('api/v1')

  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Copa Fácil API')
      .setDescription('Multi-tenant sports championship management API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-tenant-id' }, 'x-tenant-id')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
      .build()

    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig))
  }

  const port = config.get<number>('PORT') ?? 3001
  await app.listen(port)

  const logger = app.get(Logger)
  logger.log(`Application running on port ${port}`, 'Bootstrap')

  // Graceful shutdown: stop accepting connections, drain in-flight requests,
  // then trigger onModuleDestroy hooks (DB + Redis cleanup).
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully...`, 'Bootstrap')

    // Force-exit if cleanup hangs beyond 10 seconds
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit', undefined, 'Bootstrap')
      process.exit(1)
    }, 10_000)
    forceExit.unref()

    try {
      await app.close()
      logger.log('Application closed cleanly', 'Bootstrap')
      process.exit(0)
    } catch (err) {
      logger.error('Error during shutdown', String(err), 'Bootstrap')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

bootstrap()
