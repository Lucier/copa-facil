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

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
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
