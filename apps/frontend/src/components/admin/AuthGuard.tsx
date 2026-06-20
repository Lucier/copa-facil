'use client'
import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface AuthGuardProps {
  tenant: string
  children: React.ReactNode
}

export function AuthGuard({ tenant, children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${tenant}/login`)
    }
  }, [isAuthenticated, tenant, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
