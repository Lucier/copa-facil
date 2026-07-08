import type { NextRequest} from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'access_token'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  const adminMatch = /^\/([^/]+)\/admin(\/|$)/.exec(pathname)
  if (!adminMatch) return NextResponse.next()

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
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL(`/${tenant}/login`, req.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
