import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth token + tenant header on every request
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Tenant header — read from cookie or localStorage in browser
  if (typeof window !== 'undefined') {
    const tenantSlug = window.location.pathname.split('/')[1]
    if (tenantSlug) {
      config.headers['x-tenant-id'] = tenantSlug
    }
  }

  return config
})

// Handle 401 — clear auth state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  },
)

export default api
