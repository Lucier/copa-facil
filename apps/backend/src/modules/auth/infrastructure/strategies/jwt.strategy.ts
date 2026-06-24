import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'
import { JwtPayload } from '../../application/jwt-payload.interface'

function extractFromCookieOrBearer(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.['access_token']
  if (cookieToken) return cookieToken
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractFromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      passReqToCallback: false,
    })
  }

  validate(payload: JwtPayload): JwtPayload {
    // Defense-in-depth: passport-jwt checks exp when ignoreExpiration=false,
    // but an explicit check guards against clock-skew edge cases.
    if (payload.exp !== undefined && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token has expired')
    }
    return payload
  }
}
