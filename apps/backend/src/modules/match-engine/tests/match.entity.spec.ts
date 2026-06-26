import { describe, it, expect } from 'vitest'
import { MatchEntity } from '../domain/entities/match.entity'
import { MatchStatus } from '../../championships/domain/enums'

function makeMatch(overrides: Partial<{
  status: MatchStatus
  homeScore: number
  awayScore: number
  homeTeamId: string | null
  awayTeamId: string | null
}> = {}): MatchEntity {
  return new MatchEntity(
    'match-1',
    'champ-1',
    'round-1',
    overrides.homeTeamId ?? 'home-team',
    overrides.awayTeamId ?? 'away-team',
    null,
    null,
    overrides.status ?? MatchStatus.FINISHED,
    overrides.homeScore ?? 0,
    overrides.awayScore ?? 0,
    null,
    null,
    null,
    new Date(),
  )
}

describe('MatchEntity', () => {
  describe('winner()', () => {
    it('returns home team id when home score is higher', () => {
      const match = makeMatch({ homeScore: 2, awayScore: 1 })
      expect(match.winner()).toBe('home-team')
    })

    it('returns away team id when away score is higher', () => {
      const match = makeMatch({ homeScore: 0, awayScore: 3 })
      expect(match.winner()).toBe('away-team')
    })

    it('returns null when scores are equal (draw)', () => {
      const match = makeMatch({ homeScore: 1, awayScore: 1 })
      expect(match.winner()).toBeNull()
    })

    it('returns null when match is not finished', () => {
      const match = makeMatch({ status: MatchStatus.LIVE, homeScore: 2, awayScore: 0 })
      expect(match.winner()).toBeNull()
    })

    it('returns null when match is scheduled', () => {
      const match = makeMatch({ status: MatchStatus.SCHEDULED, homeScore: 0, awayScore: 0 })
      expect(match.winner()).toBeNull()
    })
  })

  describe('isDraw()', () => {
    it('returns true when match is finished with equal scores', () => {
      const match = makeMatch({ homeScore: 0, awayScore: 0 })
      expect(match.isDraw()).toBe(true)
    })

    it('returns true for non-zero equal scores', () => {
      const match = makeMatch({ homeScore: 2, awayScore: 2 })
      expect(match.isDraw()).toBe(true)
    })

    it('returns false when home wins', () => {
      const match = makeMatch({ homeScore: 3, awayScore: 1 })
      expect(match.isDraw()).toBe(false)
    })

    it('returns false when away wins', () => {
      const match = makeMatch({ homeScore: 0, awayScore: 1 })
      expect(match.isDraw()).toBe(false)
    })

    it('returns false when match is still live even with equal scores', () => {
      const match = makeMatch({ status: MatchStatus.LIVE, homeScore: 1, awayScore: 1 })
      expect(match.isDraw()).toBe(false)
    })
  })
})
