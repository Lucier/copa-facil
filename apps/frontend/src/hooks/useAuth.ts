'use client'
import { useAuthStore } from '@/store/useAuthStore'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  return { user, isAuthenticated, setAuth, clearAuth }
}
