'use client'
import { useParams } from 'next/navigation'

export function useTenant() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  return {
    tenantSlug,
    tenantSchema: tenantSlug ? `tenant_${tenantSlug}` : null,
    tenantHeader: tenantSlug ?? '',
  }
}
