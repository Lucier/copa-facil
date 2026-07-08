import axios, { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { API } from './endpoints'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tenantSlug = window.location.pathname.split('/')[1]
    if (tenantSlug) {
      config.headers['x-tenant-id'] = tenantSlug
    }
  }
  return config
})

// Mutex to prevent concurrent refresh calls when multiple requests 401 simultaneously
let isRefreshing = false
let refreshQueue: Array<() => void> = []

function drainQueue() {
  refreshQueue.forEach((resolve) => resolve())
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: InternalAxiosRequestConfig & { _retry?: boolean } = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Avoid infinite loop on the refresh endpoint itself
    if (original.url === API.auth.refresh) {
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push(() => {
          api(original).then(resolve).catch(reject)
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      await api.post(API.auth.refresh)
      drainQueue()
      return api(original)
    } catch {
      refreshQueue = []
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
