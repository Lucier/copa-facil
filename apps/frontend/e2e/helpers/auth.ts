import { SignJWT } from 'jose'
import type { BrowserContext } from '@playwright/test'

// Must match JWT_SECRET in .env.local / the running Next.js server
const SECRET = new TextEncoder().encode('dev-secret-change-me-in-production-32c')

export async function createTestJwt(role = 'organizador'): Promise<string> {
  return new SignJWT({
    sub: 'test-user-001',
    email: 'org@test.com',
    role,
    jti: 'e2e-jti-001',
    tenantSchema: 'tenant_liga_paulista',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(SECRET)
}

/**
 * Sets both the JWT cookie (passes Next.js middleware) and the Zustand localStorage
 * state (passes the AuthGuard client component).
 */
export async function loginAs(context: BrowserContext, role = 'organizador'): Promise<void> {
  const token = await createTestJwt(role)

  // 1. Set the HTTP-only cookie so the middleware lets admin routes through
  await context.addCookies([
    {
      name: 'access_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])

  // 2. Inject localStorage before any page script runs so AuthGuard sees isAuthenticated=true
  const authState = JSON.stringify({
    state: {
      user: { id: 'test-user-001', name: 'Test User', email: 'org@test.com', role },
      isAuthenticated: true,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2h from now
    },
    version: 0,
  })

  await context.addInitScript((state) => {
    window.sessionStorage.setItem('copa-facil-auth', state)
  }, authState)
}
