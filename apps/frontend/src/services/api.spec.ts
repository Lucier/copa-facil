import { beforeEach, describe, expect, it } from 'vitest'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import api from './api'
import { useAuthStore } from '@/store/useAuthStore'

function echoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return Promise.resolve({
    data: null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

describe('api client', () => {
  beforeEach(() => {
    api.defaults.adapter = echoAdapter
  })

  it('injects x-tenant-id header from the URL path', async () => {
    window.history.pushState({}, '', '/liga-paulista/dashboard')
    const res = await api.get('/teams')
    expect(res.config.headers['x-tenant-id']).toBe('liga-paulista')
  })

  it('does not inject tenant header on root path', async () => {
    window.history.pushState({}, '', '/')
    const res = await api.get('/teams')
    expect(res.config.headers['x-tenant-id']).toBeUndefined()
  })

  it('clears auth state on 401 responses', async () => {
    useAuthStore.getState().setAuth({ id: '1', name: 'L', email: 'l@t.com', role: 'admin' })
    api.defaults.adapter = (config) =>
      Promise.reject({
        response: { status: 401, data: null, statusText: 'Unauthorized', headers: {}, config },
        config,
        isAxiosError: true,
      })

    await expect(api.get('/teams')).rejects.toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('keeps auth state on non-401 errors', async () => {
    useAuthStore.getState().setAuth({ id: '1', name: 'L', email: 'l@t.com', role: 'admin' })
    api.defaults.adapter = (config) =>
      Promise.reject({
        response: { status: 500, data: null, statusText: 'Error', headers: {}, config },
        config,
        isAxiosError: true,
      })

    await expect(api.get('/teams')).rejects.toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
