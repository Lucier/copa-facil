import { beforeEach, describe, expect, it, vi } from 'vitest'

// zustand/persist expects localStorage; provide a stub for the node environment
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
})

const { useAuthStore } = await import('./useAuthStore')

const user = { id: '1', name: 'Lucier', email: 'l@t.com', role: 'admin' }

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('setAuth marks user as authenticated with default 15min expiry', () => {
    const before = Date.now()
    useAuthStore.getState().setAuth(user)
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(user)
    expect(state.expiresAt).toBeGreaterThanOrEqual(before + 15 * 60 * 1000)
    expect(state.expiresAt).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000)
  })

  it('setAuth honors explicit expiresAt', () => {
    useAuthStore.getState().setAuth(user, 123456)
    expect(useAuthStore.getState().expiresAt).toBe(123456)
  })

  it('clearAuth resets the session', () => {
    useAuthStore.getState().setAuth(user)
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.expiresAt).toBeNull()
  })
})
