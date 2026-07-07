import { CanActivate, ExecutionContext} from '@nestjs/common'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtPayload } from '../../application/jwt-payload.interface'
import { UserRole } from '../../domain/roles.enum'
import { ROLE_WEIGHT } from '../../domain/roles.enum'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class TenantRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) return true

    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>()
    const user = req.user

    if (!user?.role) {
      throw new ForbiddenException('No role assigned for this tenant')
    }

    const userWeight = ROLE_WEIGHT[user.role as UserRole] ?? 0
    const hasRole = requiredRoles.some(
      (r) => userWeight >= ROLE_WEIGHT[r],
    )

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions')
    }
    return true
  }
}
