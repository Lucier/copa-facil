import type { Page } from '@playwright/test'

/** Intercepts all calls to the backend API (axios from the browser). */
export async function mockApi(
  page: Page,
  routes: Record<string, { status?: number; body: unknown; headers?: Record<string, string> }>,
): Promise<void> {
  await page.route('**/localhost:3001/**', async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname.replace(/^\/api\/v1/, '')

    for (const [pattern, { status = 200, body, headers }] of Object.entries(routes)) {
      if (pathname.includes(pattern) || new RegExp(pattern).test(pathname)) {
        await route.fulfill({
          status,
          contentType: 'application/json',
          headers,
          body: JSON.stringify(body),
        })
        return
      }
    }

    // Fallback: network unavailable (simulates backend down)
    await route.abort('connectionrefused')
  })
}

/** Convenience: mock a successful POST /auth/login returning token pair. */
export const loginSuccessResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', name: 'Test User', email: 'org@test.com' },
}

// Use valid UUIDs so they pass z.string().uuid() in forms
export const CHAMP_ID_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
export const CHAMP_ID_2 = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
export const TEAM_ID_1 = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
export const TEAM_ID_2 = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'
export const REG_ID_1 = 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'
export const REG_ID_2 = 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'

export const championshipsListResponse = [
  { id: CHAMP_ID_1, name: 'Copa Regional 2026', season: '2026', format: 'pontos_corridos', status: 'active', legs: 1, logoUrl: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: CHAMP_ID_2, name: 'Torneio Cidade 2026', season: '2026', format: 'mata_mata', status: 'draft', legs: 1, logoUrl: null, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
]

export const registrationsListResponse = [
  { id: REG_ID_1, championshipId: CHAMP_ID_1, teamId: TEAM_ID_1, status: 'pendente', submittedBy: 'u1', reviewedBy: null, reviewNote: null, submittedAt: '2026-01-10T00:00:00Z', reviewedAt: null },
  { id: REG_ID_2, championshipId: CHAMP_ID_1, teamId: TEAM_ID_2, status: 'aprovado', submittedBy: 'u2', reviewedBy: 'u3', reviewNote: null, submittedAt: '2026-01-11T00:00:00Z', reviewedAt: '2026-01-12T00:00:00Z' },
]

export const teamsListResponse = [
  { id: TEAM_ID_1, name: 'Leões FC', acronym: 'LFC', city: 'São Paulo', primaryColor: '#000000' },
  { id: TEAM_ID_2, name: 'Águias EC', acronym: 'AEC', city: 'Campinas', primaryColor: '#0000FF' },
]
