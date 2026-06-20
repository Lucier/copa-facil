import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AppError } from '../../shared/errors/app-error'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let code = 'INTERNAL_ERROR'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      message = typeof res === 'string' ? res : ((res as Record<string, unknown>).message as string | string[])
      code = 'HTTP_EXCEPTION'
    } else if (exception instanceof AppError) {
      status = exception.statusCode
      message = exception.message
      code = exception.code
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
