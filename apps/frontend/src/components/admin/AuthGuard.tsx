'use client'
import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface AuthGuardProps {
  tenant: string
  children: React.ReactNode
}

/**
 * Secondary UX guard: the Next.js middleware (src/middleware.ts) is the real
 * security barrier — it verifies the HTTP-only cookie cryptographically before
 * serving the page. This component prevents the admin shell from being visible
 * for one frame when the client-side store lags behind the middleware decision.
 */
export function AuthGuard({ tenant, children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(`/${tenant}/login`)
    }
  }, [isAuthenticated, hasHydrated, tenant, router, pathname])

  // Show nothing until the persisted store has been rehydrated to avoid
  // flashing authenticated content before we know the actual auth state.
  if (!hasHydrated) return null

  if (!isAuthenticated) return null

  return <>{children}</>
}
