import { describe, expect, it, vi } from 'vitest'
import { DrizzleService } from '../../../database/drizzle.service'
import { NotFoundError } from '../../../shared/errors'
import {
  RankingWeightsDto} from '../application/use-cases/custom-rankings.use-case'
import {
  ComputeCustomRankingUseCase,
  CreateCustomRankingUseCase,
  DeleteCustomRankingUseCase,
  ListCustomRankingsUseCase
} from '../application/use-cases/custom-rankings.use-case'
import { GetChampionshipReportUseCase } from '../application/use-cases/get-championship-report.use-case'
import { ListMatchesForAdminUseCase } from '../application/use-cases/list-matches-for-admin.use-case'
import { UpdatePlayerStatsHandler } from '../application/handlers/update-player-stats.handler'
import { CardColor, GoalType, MatchEventType } from '../domain/enums'

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

const weights: RankingWeightsDto = {
  goals: 10,
  assists: 7,
  yellowCardPenalty: 2,
  redCardPenalty: 5,
  matchesPlayed: 1,
}

const rankingRow = {
  id: 'rank-1',
  championship_id: 'champ-1',
  name: 'Craque do Campeonato',
  weights,
  created_at: new Date('2026-07-01T00:00:00Z'),
}

describe('Custom rankings use-cases', () => {
  it('creates a ranking storing serialized weights', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[rankingRow]])
    const result = await new CreateCustomRankingUseCase(drizzle).execute('champ-1', {
      name: 'Craque do Campeonato',
      weights,
    })
    expect(result.id).toBe('rank-1')
    expect(result.createdAt).toBe('2026-07-01T00:00:00.000Z')
    expect(queries[0].values).toContain(JSON.stringify(weights))
  })

  it('lists rankings of a championship', async () => {
    const { drizzle } = makeFakeDrizzle([[rankingRow, { ...rankingRow, id: 'rank-2' }]])
    const result = await new ListCustomRankingsUseCase(drizzle).execute('champ-1')
    expect(result.map((r) => r.id)).toEqual(['rank-1', 'rank-2'])
  })

  it('deletes a ranking by id', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[]])
    await new DeleteCustomRankingUseCase(drizzle).execute('rank-1')
    expect(queries[0].text).toContain('DELETE FROM custom_rankings')
    expect(queries[0].values).toEqual(['rank-1'])
  })

  it('computes weighted scores sorted descending with ranks', async () => {
    const stats = [
      { id: 's1', team_id: 't1', team_name: 'A', player_id: 'p1', player_name: 'Artilheiro', goals: 5, assists: 1, yellow_cards: 1, red_cards: 0 },
      { id: 's2', team_id: 't2', team_name: 'B', player_id: 'p2', player_name: 'Garçom', goals: 1, assists: 6, yellow_cards: 0, red_cards: 1 },
    ]
    const { drizzle } = makeFakeDrizzle([[rankingRow], stats])
    const result = await new ComputeCustomRankingUseCase(drizzle, {} as never).execute('rank-1')

    // p1: 5*10 + 1*7 - 1*2 = 55; p2: 1*10 + 6*7 - 1*5 = 47
    expect(result[0]).toMatchObject({ rank: 1, playerId: 'p1', score: 55 })
    expect(result[1]).toMatchObject({ rank: 2, playerId: 'p2', score: 47 })
  })

  it('throws NotFoundError for unknown ranking', async () => {
    const { drizzle } = makeFakeDrizzle([[]])
    await expect(new ComputeCustomRankingUseCase(drizzle, {} as never).execute('x')).rejects.toThrow(
      NotFoundError,
    )
  })
})

const matchRow = {
  id: 'm-1',
  status: 'concluded',
  home_team_id: 't1',
  away_team_id: 't2',
  home_team_name: 'Time A',
  home_team_acronym: 'TA',
  away_team_name: 'Time B',
  away_team_acronym: 'TB',
  home_score: 2,
  away_score: 1,
  scheduled_at: new Date('2026-07-01T15:00:00Z'),
  started_at: '2026-07-01T15:05:00Z',
  ended_at: null,
  round_id: 'r-1',
  round_number: 1,
  round_name: 'Rodada 1',
  round_phase: 'league',
  group_id: null,
  bracket_slot: null,
  is_bye: false,
}

describe('ListMatchesForAdminUseCase', () => {
  it('maps rows to camelCase DTOs with ISO dates', async () => {
    const { drizzle, queries } = makeFakeDrizzle([[matchRow]])
    const result = await new ListMatchesForAdminUseCase(drizzle).execute('champ-1')
    expect(result[0]).toMatchObject({
      id: 'm-1',
      homeTeamName: 'Time A',
      scheduledAt: '2026-07-01T15:00:00.000Z',
      startedAt: '2026-07-01T15:05:00.000Z',
      endedAt: null,
      isBye: false,
    })
    expect(queries[0].values).toContain('champ-1')
  })

  it('flags bye matches', async () => {
    const { drizzle } = makeFakeDrizzle([[{ ...matchRow, away_team_id: null, is_bye: true }]])
    const result = await new ListMatchesForAdminUseCase(drizzle).execute('champ-1')
    expect(result[0].isBye).toBe(true)
  })
})

describe('GetChampionshipReportUseCase', () => {
  it('builds report with top scorers, assisters and disciplinary rankings', async () => {
    const standings = [
      { id: 'st1', championship_id: 'champ-1', group_id: null, team_id: 't1', team_name: 'Time A', team_acronym: 'TA', matches_played: 2, wins: 2, draws: 0, losses: 0, goals_for: 5, goals_against: 1, goal_difference: 4, points: 6, yellow_cards: 1, red_cards: 0, fair_play_points: 1 },
    ]
    const stats = [
      { id: 's1', team_id: 't1', team_name: 'Time A', player_id: 'p1', player_name: 'Artilheiro', goals: 4, assists: 0, yellow_cards: 0, red_cards: 0 },
      { id: 's2', team_id: 't1', team_name: 'Time A', player_id: 'p2', player_name: 'Garçom', goals: 0, assists: 3, yellow_cards: 1, red_cards: 0 },
      { id: 's3', team_id: 't2', team_name: 'Time B', player_id: 'p3', player_name: 'Violento', goals: 0, assists: 0, yellow_cards: 1, red_cards: 2 },
      { id: 's4', team_id: 't2', team_name: 'Time B', player_id: 'p4', player_name: 'Discreto', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
    ]
    const { drizzle } = makeFakeDrizzle([[matchRow], standings, stats])
    const report = await new GetChampionshipReportUseCase(drizzle).execute('champ-1')

    expect(report.matches).toHaveLength(1)
    expect(report.standings[0]).toMatchObject({ teamName: 'Time A', points: 6 })
    expect(report.topScorers.map((s) => s.playerId)).toEqual(['p1'])
    expect(report.topAssisters.map((s) => s.playerId)).toEqual(['p2'])
    // disciplinary sorted by yellow + 3*red: p3 (7) > p2 (1); p4 excluded
    expect(report.disciplinary.map((s) => s.playerId)).toEqual(['p3', 'p2'])
  })
})

describe('UpdatePlayerStatsHandler', () => {
  function makeHandler(events: unknown[]) {
    const eventRepo = { findByChampionshipId: vi.fn().mockResolvedValue(events) }
    const statRepo = { upsertMany: vi.fn() }
    const handler = new UpdatePlayerStatsHandler(eventRepo as never, statRepo as never)
    return { handler, statRepo }
  }

  const baseEvent = {
    tenantSchema: 'tenant_liga',
    matchEvent: { championshipId: 'champ-1' },
  } as never

  it('aggregates goals, assists and cards per player', async () => {
    const { handler, statRepo } = makeHandler([
      { eventType: MatchEventType.GOL, playerId: 'p1', teamId: 't1', goalType: GoalType.NORMAL, assistPlayerId: 'p2' },
      { eventType: MatchEventType.GOL, playerId: 'p1', teamId: 't1', goalType: GoalType.NORMAL },
      { eventType: MatchEventType.CARTAO, playerId: 'p1', teamId: 't1', cardColor: CardColor.AMARELO },
      { eventType: MatchEventType.CARTAO, playerId: 'p2', teamId: 't1', cardColor: CardColor.VERMELHO },
      { eventType: MatchEventType.EXPULSAO, playerId: 'p3', teamId: 't2' },
    ])
    await handler.handle(baseEvent)

    const upserted = statRepo.upsertMany.mock.calls[0][0]
    const p1 = upserted.find((s: { playerId: string }) => s.playerId === 'p1')
    const p2 = upserted.find((s: { playerId: string }) => s.playerId === 'p2')
    const p3 = upserted.find((s: { playerId: string }) => s.playerId === 'p3')
    expect(p1).toMatchObject({ goals: 2, yellowCards: 1, redCards: 0 })
    expect(p2).toMatchObject({ assists: 1, redCards: 1 })
    expect(p3).toMatchObject({ redCards: 1 })
  })

  it('does not count own goals as goals for the player', async () => {
    const { handler, statRepo } = makeHandler([
      { eventType: MatchEventType.GOL, playerId: 'p1', teamId: 't1', goalType: GoalType.CONTRA },
    ])
    await handler.handle(baseEvent)
    const upserted = statRepo.upsertMany.mock.calls[0][0]
    expect(upserted[0]).toMatchObject({ playerId: 'p1', goals: 0 })
  })

  it('skips upsert when there are no relevant events', async () => {
    const { handler, statRepo } = makeHandler([])
    await handler.handle(baseEvent)
    expect(statRepo.upsertMany).not.toHaveBeenCalled()
  })

  it('swallows repository errors without throwing', async () => {
    const eventRepo = { findByChampionshipId: vi.fn().mockRejectedValue(new Error('DB error')) }
    const handler = new UpdatePlayerStatsHandler(eventRepo as never, { upsertMany: vi.fn() } as never)
    await expect(handler.handle(baseEvent)).resolves.toBeUndefined()
  })
})
