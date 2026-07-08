import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthOrganization {
  slug: string
  name: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  organizations?: AuthOrganization[]
}

// Default session window matches JWT access-token TTL (15 min)
const DEFAULT_SESSION_MS = 15 * 60 * 1_000

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  expiresAt: number | null
  _hasHydrated: boolean
  setAuth: (user: AuthUser, expiresAt?: number) => void
  clearAuth: () => void
  _setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      expiresAt: null,
      _hasHydrated: false,
      setAuth: (user, expiresAt) =>
        set({ user, isAuthenticated: true, expiresAt: expiresAt ?? Date.now() + DEFAULT_SESSION_MS }),
      clearAuth: () => set({ user: null, isAuthenticated: false, expiresAt: null }),
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'copa-facil-auth',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && state.expiresAt < Date.now()) {
          state.clearAuth()
        }
        state?._setHasHydrated(true)
      },
    },
  ),
)
