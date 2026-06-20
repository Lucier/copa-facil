import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'

@Injectable()
export class AppLoggerService {
  constructor(private readonly logger: PinoLogger) {}

  log(message: string, context?: string): void {
    this.logger.info({ context }, message)
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message)
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message)
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message)
  }
}
