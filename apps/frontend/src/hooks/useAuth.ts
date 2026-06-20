'use client'
import { useAuthStore } from '@/store/useAuthStore'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  return { user, token, isAuthenticated, setAuth, clearAuth }
}
