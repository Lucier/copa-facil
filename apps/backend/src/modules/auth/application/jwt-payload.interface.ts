export interface JwtPayload {
  sub: string
  email: string
  jti: string
  tenantSchema?: string
  role?: string
  exp?: number
  iat?: number
}
