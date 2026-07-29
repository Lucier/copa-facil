import { BadRequestException, Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import type { Request } from 'express'
import { TenantContext } from '../tenant/tenant-context'
import { JwtPayload } from '../../modules/auth/application/jwt-payload.interface'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>()

    // For authenticated requests, the JWT's tenantSchema is authoritative.
    // This prevents a client from spoofing x-tenant-id to access another tenant.
    // For public-API routes (API-key auth) the ApiKeyGuard sets x-tenant-id before
    // this interceptor runs, and req.user is undefined, so we fall through to the header.
    let schema: string
    if (req.user?.tenantSchema) {
      schema = req.user.tenantSchema
    } else {
      const tenantHeader = req.headers['x-tenant-id'] as string | undefined
      if (tenantHeader && !SLUG_PATTERN.test(tenantHeader)) {
        throw new BadRequestException('Invalid tenant identifier')
      }
      schema = tenantHeader ? `tenant_${tenantHeader}` : 'public'
    }

    return new Observable((observer) => {
      TenantContext.run(schema, () => {
        next.handle().subscribe({
          next: (v) => observer.next(v),
          error: (e) => observer.error(e),
          complete: () => observer.complete(),
        })
      })
    })
  }
}
