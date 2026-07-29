import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'access_token'

// Edge Runtime uses Web Crypto — not Node.js crypto
function generateNonce(): string {
  const array = new Uint8Array(16)
  globalThis.crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

function buildCsp(nonce: string, isDev: boolean): string {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : 'http://localhost:3001'

  // 'strict-dynamic' trusts scripts loaded by a nonced script, covering Next.js lazy chunks
  const scriptSrc = isDev
    ? `'nonce-${nonce}' 'unsafe-eval' 'strict-dynamic'`
    : `'nonce-${nonce}' 'strict-dynamic'`

  return [
    "default-src 'self'",
    `script-src 'self' ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${apiOrigin}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${apiOrigin}${isDev ? ' ws://localhost:* wss://localhost:*' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const isDev = process.env.NODE_ENV !== 'production'

  // Generate a fresh nonce for every request (Web Crypto — Edge Runtime compatible)
  const nonce = generateNonce()
  const csp = buildCsp(nonce, isDev)

  // Propagate nonce to Server Components via request header
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const adminMatch = /^\/([^/]+)\/admin(\/|$)/.exec(pathname)
  if (!adminMatch) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  const tenant = adminMatch[1]
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL(`/${tenant}/login`, req.url))
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET is not set — refusing to serve protected route', pathname)
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    await jwtVerify(token, secret)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Content-Security-Policy', csp)
    return response
  } catch {
    const response = NextResponse.redirect(new URL(`/${tenant}/login`, req.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
