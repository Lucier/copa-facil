import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void
  updateToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true }),

      updateToken: (token) => set({ token }),

      clearAuth: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'cerrados-esportes-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
