import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTenant } from './useTenant'

const useParamsMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useParams: useParamsMock }))

describe('useTenant', () => {
  it('derives schema and header from the tenant route param', () => {
    useParamsMock.mockReturnValue({ tenant: 'liga-paulista' })
    const { result } = renderHook(() => useTenant())
    expect(result.current.tenantSlug).toBe('liga-paulista')
    expect(result.current.tenantSchema).toBe('tenant_liga-paulista')
    expect(result.current.tenantHeader).toBe('liga-paulista')
  })

  it('returns null schema and empty header without tenant param', () => {
    useParamsMock.mockReturnValue({})
    const { result } = renderHook(() => useTenant())
    expect(result.current.tenantSchema).toBeNull()
    expect(result.current.tenantHeader).toBe('')
  })
})
