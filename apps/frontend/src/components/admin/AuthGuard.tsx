'use client'
import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/services/api'
import { API } from '@/services/endpoints'

interface AuthGuardProps {
  tenant: string
  children: React.ReactNode
}

interface RefreshResponse {
  user: { id: string; name: string; email: string }
}

/**
 * Secondary UX guard: the Next.js middleware (src/middleware.ts) is the real
 * security barrier — it verifies the HTTP-only cookie cryptographically before
 * serving the page. This component prevents the admin shell from being visible
 * for one frame when the client-side store lags behind the middleware decision.
 *
 * When the client-side store has expired (e.g. after a long MP checkout redirect),
 * we attempt a silent token refresh before giving up and redirecting to login.
 */
export function AuthGuard({ tenant, children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const setAuth = useAuthStore((s) => s.setAuth)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!hasHydrated || isAuthenticated) return

    api.post<RefreshResponse>(API.auth.refresh)
      .then(({ data }) => {
        setAuth({ id: data.user.id, name: data.user.name, email: data.user.email, role: 'organizador' })
      })
      .catch(() => {
        router.replace(`/${tenant}/login`)
      })
  }, [isAuthenticated, hasHydrated, tenant, router, pathname, setAuth])

  if (!hasHydrated) return null
  if (!isAuthenticated) return null

  return <>{children}</>
}
