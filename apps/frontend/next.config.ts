import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

function buildCsp(): string {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : 'http://localhost:3001'

  return [
    "default-src 'self'",
    // Dev: needs 'unsafe-eval' for webpack eval-source-map; prod: omit it
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https: ${apiOrigin}`,
    "font-src 'self' https://fonts.gstatic.com",
    // Allow fetch/XHR to the backend origin (http in dev, https in prod)
    `connect-src 'self' ${apiOrigin}${isDev ? ' ws://localhost:* wss://localhost:*' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildCsp() },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS only in production — browsers cache it; setting it in dev breaks http://localhost
  ...(isDev ? [] : [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ]),
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
