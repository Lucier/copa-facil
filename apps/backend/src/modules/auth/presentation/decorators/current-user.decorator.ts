import { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'
import { JwtPayload } from '../../application/jwt-payload.interface'

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: JwtPayload }>()
    return field ? req.user[field] : req.user
  },
)
