import { describe, expect, it } from 'vitest'
import { DrizzleService } from '../../../database/drizzle.service'
import { ListSuspensionsUseCase } from '../application/use-cases/list-suspensions.use-case'

function makeFakeDrizzle(results: unknown[][]) {
  const queries: { text: string; values: unknown[] }[] = []
  let call = 0
  const tx = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({ text: strings.join('?'), values })
    return Promise.resolve(results[call++] ?? [])
  }
  const drizzle = {
    runInTenantContext: (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
  } as unknown as DrizzleService
  return { drizzle, queries }
}

const row = {
  id: 'sus-1',
  championship_id: 'champ-1',
  player_id: 'p-1',
  player_name: 'João',
  team_id: 't-1',
  team_name: 'Time A',
  team_acronym: 'TA',
  reason: 'Cartão vermelho',
  source: 'auto',
  matches_to_serve: 2,
  matches_served: 1,
  status: 'ativa',
  event_id: 'ev-1',
  notes: null,
  created_at: new Date('2026-07-01T00:00:00Z'),
  updated_at: new Date('2026-07-02T00:00:00Z'),
}

describe('ListSuspensionsUseCase', () => {
  it('lists suspensions mapped to camelCase DTOs', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[row]])
    const result = await new ListSuspensionsUseCase(drizzle).execute('champ-1')
    expect(result[0]).toMatchObject({
      id: 'sus-1',
      playerName: 'João',
      teamAcronym: 'TA',
      matchesToServe: 2,
      matchesServed: 1,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
    expect(queries[0].text).not.toContain('s.status =')
  })

  it('applies the status filter when provided', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[row]])
    await new ListSuspensionsUseCase(drizzle).execute('champ-1', 'ativa')
    expect(queries[0].text).toContain('s.status =')
    expect(queries[0].values).toEqual(['champ-1', 'ativa'])
  })
})
