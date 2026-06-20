import { describe, it, expect } from 'vitest'
import { TournamentEngine } from '../domain/services/tournament-engine'

// ── generateRoundRobin ────────────────────────────────────────────────────────

describe('TournamentEngine.generateRoundRobin', () => {
  it('throws with fewer than 2 teams', () => {
    expect(() => TournamentEngine.generateRoundRobin(['A'], 1)).toThrow('Need at least 2 teams')
  })

  it('generates n-1 rounds for n even teams', () => {
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B', 'C', 'D'], 1)
    expect(rounds).toHaveLength(3)
  })

  it('generates n-1 rounds for n odd teams (bye padded)', () => {
    // 3 teams → padded to 4 → 3 rounds
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B', 'C'], 1)
    expect(rounds).toHaveLength(3)
  })

  it('each team appears exactly once per round in a 4-team draw', () => {
    const teams = ['A', 'B', 'C', 'D']
    const rounds = TournamentEngine.generateRoundRobin(teams, 1)
    for (const round of rounds) {
      const participants = round.matches.flatMap((m) => [m.homeTeamId, m.awayTeamId])
      for (const t of teams) {
        expect(participants.filter((p) => p === t)).toHaveLength(1)
      }
    }
  })

  it('every pair meets exactly once in single-leg round robin', () => {
    const teams = ['A', 'B', 'C', 'D']
    const rounds = TournamentEngine.generateRoundRobin(teams, 1)
    const pairCounts: Record<string, number> = {}
    for (const round of rounds) {
      for (const m of round.matches) {
        const key = [m.homeTeamId, m.awayTeamId].sort().join('-')
        pairCounts[key] = (pairCounts[key] ?? 0) + 1
      }
    }
    const expectedPairs = 6 // C(4,2)
    expect(Object.keys(pairCounts)).toHaveLength(expectedPairs)
    for (const count of Object.values(pairCounts)) {
      expect(count).toBe(1)
    }
  })

  it('doubles rounds for legs=2 and reverses home/away', () => {
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B', 'C', 'D'], 2)
    expect(rounds).toHaveLength(6)
    // First half vs second half should have swapped home/away for each match
    const first = rounds[0]
    const returnRound = rounds[3]
    for (let i = 0; i < first.matches.length; i++) {
      expect(returnRound.matches[i].homeTeamId).toBe(first.matches[i].awayTeamId)
      expect(returnRound.matches[i].awayTeamId).toBe(first.matches[i].homeTeamId)
    }
  })

  it('assigns sequential round numbers starting at 1', () => {
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B'], 1)
    expect(rounds[0].roundNumber).toBe(1)
  })

  it('isBye is never true in even-team draw', () => {
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B', 'C', 'D'], 1)
    for (const round of rounds) {
      for (const m of round.matches) {
        expect(m.isBye).toBe(false)
      }
    }
  })

  it('two-team draw produces exactly 1 round with 1 match', () => {
    const rounds = TournamentEngine.generateRoundRobin(['A', 'B'], 1)
    expect(rounds).toHaveLength(1)
    expect(rounds[0].matches).toHaveLength(1)
    const m = rounds[0].matches[0]
    expect([m.homeTeamId, m.awayTeamId].sort()).toEqual(['A', 'B'])
  })
})

// ── generateEliminationBracket ────────────────────────────────────────────────

describe('TournamentEngine.generateEliminationBracket', () => {
  it('throws with fewer than 2 teams', () => {
    expect(() => TournamentEngine.generateEliminationBracket(['A'], 1)).toThrow(
      'Need at least 2 teams',
    )
  })

  it('produces log2(size) rounds for 4 exact-power teams', () => {
    const rounds = TournamentEngine.generateEliminationBracket(['A', 'B', 'C', 'D'], 1)
    expect(rounds).toHaveLength(2)
    expect(rounds[0].matches).toHaveLength(2) // 2 QF matches
    expect(rounds[1].matches).toHaveLength(1) // 1 Final
  })

  it('pads to next power of two (5 teams → 8-bracket, 3 first-round matches)', () => {
    const rounds = TournamentEngine.generateEliminationBracket(
      ['A', 'B', 'C', 'D', 'E'],
      1,
    )
    expect(rounds).toHaveLength(3) // 8 → log2(8) = 3
    expect(rounds[0].matches).toHaveLength(4)
  })

  it('seed 1 and seed 2 appear on opposite halves of first round', () => {
    const teams = ['S1', 'S2', 'S3', 'S4']
    const rounds = TournamentEngine.generateEliminationBracket(teams, 1)
    const firstRoundMatches = rounds[0].matches

    const matchIdx1 = firstRoundMatches.findIndex(
      (m) => m.homeTeamId === 'S1' || m.awayTeamId === 'S1',
    )
    const matchIdx2 = firstRoundMatches.findIndex(
      (m) => m.homeTeamId === 'S2' || m.awayTeamId === 'S2',
    )
    expect(matchIdx1).not.toBe(matchIdx2)
  })

  it('final round is always named Final', () => {
    const rounds = TournamentEngine.generateEliminationBracket(['A', 'B', 'C', 'D'], 1)
    expect(rounds[rounds.length - 1].name).toBe('Final')
  })

  it('subsequent rounds have null teams and correct sourceSlot references', () => {
    const rounds = TournamentEngine.generateEliminationBracket(['A', 'B', 'C', 'D'], 1)
    const final = rounds[1]
    expect(final.matches[0].homeTeamId).toBeNull()
    expect(final.matches[0].awayTeamId).toBeNull()
    expect(final.matches[0].sourceSlotA).toBe(0)
    expect(final.matches[0].sourceSlotB).toBe(1)
  })

  it('marks bye when one slot is null in first round', () => {
    // 3 teams → 4-bracket → 1 bye in first round
    const rounds = TournamentEngine.generateEliminationBracket(['A', 'B', 'C'], 1)
    const byeMatches = rounds[0].matches.filter((m) => m.isBye)
    expect(byeMatches).toHaveLength(1)
  })
})

// ── generateGroupsAndKnockout ─────────────────────────────────────────────────

describe('TournamentEngine.generateGroupsAndKnockout', () => {
  it('throws when groupCount < 2', () => {
    expect(() =>
      TournamentEngine.generateGroupsAndKnockout(['A', 'B', 'C', 'D'], 1, 1, 1),
    ).toThrow('groupCount must be >= 2')
  })

  it('throws when not enough teams to fill groups', () => {
    expect(() =>
      TournamentEngine.generateGroupsAndKnockout(['A', 'B', 'C'], 2, 1, 1),
    ).toThrow('Not enough teams')
  })

  it('distributes 8 teams into 2 groups of 4 via snake seeding', () => {
    const teams = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']
    const result = TournamentEngine.generateGroupsAndKnockout(teams, 2, 2, 1)
    expect(result.groups).toHaveLength(2)
    expect(result.groups[0].teamIds).toHaveLength(4)
    expect(result.groups[1].teamIds).toHaveLength(4)
    // All teams accounted for
    const all = result.groups.flatMap((g) => g.teamIds).sort()
    expect(all).toEqual([...teams].sort())
  })

  it('generates group round-robins for each group', () => {
    const teams = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']
    const result = TournamentEngine.generateGroupsAndKnockout(teams, 2, 1, 1)
    expect(result.groupRounds.size).toBe(2)
    for (const rounds of result.groupRounds.values()) {
      expect(rounds.length).toBeGreaterThan(0)
    }
  })

  it('produces correct number of knockout seed placeholders', () => {
    const teams = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']
    const result = TournamentEngine.generateGroupsAndKnockout(teams, 2, 2, 1)
    // 2 groups × 2 qualifiers = 4 seeds
    expect(result.knockoutSeeds).toHaveLength(4)
    expect(result.knockoutSeeds.every((s) => s === null)).toBe(true)
  })

  it('assigns group names A, B, C in order', () => {
    const teams = Array.from({ length: 6 }, (_, i) => `T${i + 1}`)
    const result = TournamentEngine.generateGroupsAndKnockout(teams, 3, 1, 1)
    expect(result.groups.map((g) => g.name)).toEqual(['A', 'B', 'C'])
  })

  it('snake-seed puts top seeds in different groups', () => {
    const teams = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']
    const result = TournamentEngine.generateGroupsAndKnockout(teams, 2, 2, 1)
    // T1 should be in group A, T2 in group B (snake seed)
    expect(result.groups[0].teamIds).toContain('T1')
    expect(result.groups[1].teamIds).toContain('T2')
  })
})
