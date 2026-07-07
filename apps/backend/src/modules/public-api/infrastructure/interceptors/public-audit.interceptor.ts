import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { finalize } from 'rxjs/operators'
import type { Request } from 'express'
import { DrizzleService } from '../../../../database/drizzle.service'

const SENTINEL_USER_ID = '00000000-0000-0000-0000-000000000000'

@Injectable()
export class PublicAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PublicAuditInterceptor.name)

  constructor(private readonly drizzle: DrizzleService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { apiKeyId?: string }>()
    const action = `PUBLIC_API:${req.method}:${req.path}`
    const apiKeyId = req['apiKeyId']

    return next.handle().pipe(
      finalize(() => {
        this.drizzle
          .runInTenantContext((tx) =>
            tx`
              INSERT INTO audit_logs (user_id, action, resource, metadata)
              VALUES (
                ${SENTINEL_USER_ID}::uuid,
                ${action},
                'public_api',
                ${JSON.stringify({ apiKeyId, ip: req.ip, userAgent: req.headers['user-agent'] })}::jsonb
              )
            `,
          )
          .catch((err: unknown) => {
            this.logger.warn(`Failed to write public API audit log: ${String(err)}`)
          })
      }),
    )
  }
}
