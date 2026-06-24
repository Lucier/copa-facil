import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Inject tenant header on every request (JWT travels via HTTP-only cookie automatically)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tenantSlug = window.location.pathname.split('/')[1]
    if (tenantSlug) {
      config.headers['x-tenant-id'] = tenantSlug
    }
  }
  return config
})

// Handle 401 — clear client-side user state (cookie is cleared server-side on logout)
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
