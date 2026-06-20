import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import type { Request } from 'express'
import { TenantContext } from '../tenant/tenant-context'

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>()
    const tenantId = req.headers['x-tenant-id'] as string | undefined
    const schema = tenantId ? `tenant_${tenantId}` : 'public'

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
