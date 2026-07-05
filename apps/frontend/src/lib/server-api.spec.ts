import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { publicFetch } from './server-api'

describe('publicFetch', () => {
  beforeEach(() => {
    process.env.PORTAL_API_KEY_LIGA_PAULISTA = 'test-key'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [] }) }),
    )
  })

  afterEach(() => {
    delete process.env.PORTAL_API_KEY_LIGA_PAULISTA
    vi.unstubAllGlobals()
  })

  it('calls the public API with the tenant api key and query params', async () => {
    const result = await publicFetch('liga-paulista', 'standings', { page: '2' })
    expect(result).toEqual({ data: [] })

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/public/standings')
    expect(String(url)).toContain('page=2')
    expect((options as RequestInit).headers).toMatchObject({ 'x-api-key': 'test-key' })
  })

  it('throws when no api key is configured for the tenant', async () => {
    await expect(publicFetch('outro-tenant', 'standings')).rejects.toThrow(
      /No PORTAL_API_KEY configured/,
    )
  })

  it('throws on non-ok responses', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response)
    await expect(publicFetch('liga-paulista', 'standings')).rejects.toThrow(/503/)
  })
})
