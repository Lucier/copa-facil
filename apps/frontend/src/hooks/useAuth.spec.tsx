import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

const user = { id: '1', name: 'Lucier', email: 'l@t.com', role: 'admin' }

describe('useAuth', () => {
  it('exposes auth state and reacts to setAuth/clearAuth', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)

    act(() => result.current.setAuth(user))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(user)

    act(() => result.current.clearAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
