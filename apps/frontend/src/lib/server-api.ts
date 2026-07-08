if (!process.env.BACKEND_URL && process.env.NODE_ENV === 'production') {
  throw new Error('BACKEND_URL is required in production')
}
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001/api/v1'

function apiKey(tenant: string): string {
  const key = process.env[`PORTAL_API_KEY_${tenant.toUpperCase().replace(/-/g, '_')}`]
  if (!key) throw new Error(`No PORTAL_API_KEY configured for tenant "${tenant}"`)
  return key
}

export async function publicFetch<T>(tenant: string, path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BACKEND}/public/${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': apiKey(tenant) },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`publicFetch ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export interface Paginated<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
}
