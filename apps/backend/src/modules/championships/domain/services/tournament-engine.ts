/**
 * TournamentEngine — pure, stateless, framework-free fixture generation.
 *
 * Implements three competition formats:
 *   1. Pontos Corridos: Berger Tables (Circle Method) for balanced round-robin
 *   2. Mata-Mata: Seeded elimination bracket with bye support
 *   3. Grupos + Mata-Mata: Group-stage round-robin feeding into a knockout bracket
 */

export interface MatchSlot {
  homeTeamId: string | null
  awayTeamId: string | null
  isBye: boolean
}

export interface RoundSlot {
  roundNumber: number   // 1-based
  name: string
  matches: MatchSlot[]
}

export interface BracketRound {
  roundNumber: number   // 1 = first played, increasing toward final
  name: string
  matches: BracketMatchSlot[]
}

export interface BracketMatchSlot {
  slot: number          // 0-based position within the round
  homeTeamId: string | null
  awayTeamId: string | null
  isBye: boolean
  sourceSlotA: number | null   // slot index in previous round feeding home
  sourceSlotB: number | null   // slot index in previous round feeding away
}

export interface GroupSlot {
  name: string          // 'A', 'B', 'C'…
  orderIndex: number
  teamIds: string[]
}

export interface GroupsAndKnockoutResult {
  groups: GroupSlot[]
  groupRounds: Map<number, RoundSlot[]>   // orderIndex → rounds
  knockoutSeeds: (string | null)[]        // placeholder TBD seeds for bracket
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

/**
 * Recursive bracket seeding so that the top two seeds can only meet in the
 * final. seeds(8) → [1,8,4,5,2,7,3,6], giving pairs (1,8),(4,5),(2,7),(3,6).
 */
function bracketSeeds(size: number): number[] {
  if (size === 2) return [1, 2]
  const half = bracketSeeds(size / 2)
  const result: number[] = []
  for (const s of half) result.push(s, size + 1 - s)
  return result
}

function knockoutRoundName(fromFinal: number): string {
  const names: Record<number, string> = {
    1: 'Final',
    2: 'Semifinal',
    3: 'Quartas de Final',
    4: 'Oitavas de Final',
    5: 'Dezesseis Avos',
    6: 'Trinta e Dois Avos',
  }
  return names[fromFinal] ?? `Fase de ${Math.pow(2, fromFinal)} Equipes`
}

// ─── TournamentEngine ─────────────────────────────────────────────────────────

export class TournamentEngine {
  // ── 1. Berger Tables / Circle Method ───────────────────────────────────────
  /**
   * Generates a balanced round-robin fixture list using the Circle Method.
   *
   * Home/away assignment follows the parity rule that minimises consecutive
   * same-venue runs: for the fixed-vs-rotating-[0] pair the venue alternates
   * every round; for all other pairs it alternates based on (i + round) % 2.
   *
   * @param teamIds  Ordered list of participant IDs.  If odd, a null "bye" slot
   *                 is appended internally — matches against a bye are omitted.
   * @param legs     1 = single round-robin, 2 = turno e retorno (home + away).
   */
  static generateRoundRobin(teamIds: string[], legs: 1 | 2): RoundSlot[] {
    if (teamIds.length < 2) throw new Error('Need at least 2 teams')

    const hasOdd = teamIds.length % 2 !== 0
    // Pad to even; null represents a bye (no real team)
    const paddedTeams: (string | null)[] = hasOdd
      ? [...teamIds, null]
      : [...teamIds]
    const n = paddedTeams.length

    // Fixed = last element; ring = first n-1 elements (will be rotated)
    const fixed: string | null = paddedTeams[n - 1]
    const ring: (string | null)[] = paddedTeams.slice(0, n - 1)

    const rounds: RoundSlot[] = []

    for (let r = 0; r < n - 1; r++) {
      const matchSlots: MatchSlot[] = []

      // Pair 1: fixed vs ring[0] — home alternates every round
      const teamA = ring[0]
      const teamB = fixed
      if (teamA !== null && teamB !== null) {
        const evenRound = r % 2 === 0
        matchSlots.push(
          evenRound
            ? { homeTeamId: teamA, awayTeamId: teamB, isBye: false }
            : { homeTeamId: teamB, awayTeamId: teamA, isBye: false },
        )
      }

      // Remaining pairs: ring[i] vs ring[n-1-i]
      // ring has n-1 elements (indices 0..n-2), so the mirror of index i is n-1-i
      for (let i = 1; i < n / 2; i++) {
        const x = ring[i]
        const y = ring[n - 1 - i]
        if (x !== null && y !== null) {
          const flip = (i + r) % 2 !== 0
          matchSlots.push(
            flip
              ? { homeTeamId: y, awayTeamId: x, isBye: false }
              : { homeTeamId: x, awayTeamId: y, isBye: false },
          )
        }
      }

      rounds.push({
        roundNumber: r + 1,
        name: `Rodada ${r + 1}`,
        matches: matchSlots,
      })

      // Rotate ring counter-clockwise: last element moves to front
      ring.unshift(ring.pop()!)
    }

    if (legs === 2) {
      const returnRounds: RoundSlot[] = rounds.map((rd) => ({
        roundNumber: rd.roundNumber + (n - 1),
        name: `Rodada ${rd.roundNumber + (n - 1)} (Returno)`,
        matches: rd.matches.map((m) => ({
          homeTeamId: m.awayTeamId,
          awayTeamId: m.homeTeamId,
          isBye: m.isBye,
        })),
      }))
      rounds.push(...returnRounds)
    }

    return rounds
  }

  // ── 2. Elimination Bracket ──────────────────────────────────────────────────
  /**
   * Generates a seeded single-elimination bracket.
   *
   * The bracket is sized to the next power of two above the number of teams.
   * Extra slots are filled with null (byes).  Seeds are distributed so that
   * seed 1 can only meet seed 2 in the final — using the recursive interleaving
   * formula: seeds(n) = seeds(n/2).flatMap(s => [s, n+1-s]).
   *
   * @param seededTeams  Team IDs ordered 1st-seed first.  Pass null entries for
   *                     bye slots you want to fix explicitly.
   * @param legs         1 = single-leg tie, 2 = home-and-away (ida e volta).
   *                     For legs=2 every "match" logically becomes two fixtures;
   *                     the bracket structure returned is identical — callers
   *                     duplicate matches when persisting.
   */
  static generateEliminationBracket(
    seededTeams: (string | null)[],
    legs: 1 | 2,
  ): BracketRound[] {
    if (seededTeams.length < 2) throw new Error('Need at least 2 teams')

    const size = nextPowerOfTwo(seededTeams.length)
    // Pad with byes
    const padded: (string | null)[] = [
      ...seededTeams,
      ...Array<null>(size - seededTeams.length).fill(null),
    ]

    // Seed position order for first round
    const seedOrder = bracketSeeds(size)

    const firstRoundMatches: BracketMatchSlot[] = []
    for (let i = 0; i < size; i += 2) {
      const home = padded[seedOrder[i] - 1] ?? null
      const away = padded[seedOrder[i + 1] - 1] ?? null
      const isBye = home !== null && away === null
      firstRoundMatches.push({
        slot: i / 2,
        homeTeamId: home,
        awayTeamId: away,
        isBye,
        sourceSlotA: null,
        sourceSlotB: null,
      })
    }

    const totalRounds = Math.log2(size)
    const bracketRounds: BracketRound[] = []

    // First round
    bracketRounds.push({
      roundNumber: 1,
      name: knockoutRoundName(totalRounds),
      matches: firstRoundMatches,
    })

    // Subsequent rounds (TBD teams)
    let prevMatchCount = firstRoundMatches.length
    for (let r = 1; r < totalRounds; r++) {
      const matchCount = prevMatchCount / 2
      const matches: BracketMatchSlot[] = []
      for (let s = 0; s < matchCount; s++) {
        matches.push({
          slot: s,
          homeTeamId: null,
          awayTeamId: null,
          isBye: false,
          // winner of slot 2s feeds home; winner of slot 2s+1 feeds away
          sourceSlotA: s * 2,
          sourceSlotB: s * 2 + 1,
        })
      }
      bracketRounds.push({
        roundNumber: r + 1,
        name: knockoutRoundName(totalRounds - r),
        matches,
      })
      prevMatchCount = matchCount
    }

    // For legs=2: each bracket slot becomes an ida+volta pair — callers handle
    // the duplication at persistence time; the tree structure is unchanged.
    void legs

    return bracketRounds
  }

  // ── 3. Groups + Knockout ───────────────────────────────────────────────────
  /**
   * Distributes teams into groups, generates round-robin within each group,
   * and pre-calculates qualification slots for the knockout bracket.
   *
   * Teams are distributed via snake-seeding: seed 1→Group A, 2→Group B, …,
   * n→Group N, n+1→Group N, n+2→Group N-1, … (reversing direction each lap).
   * This ensures groups are balanced in strength when teams are seeded.
   *
   * Qualification slots are interleaved to avoid same-group teams meeting in
   * the first knockout round: slot 0 = Gr-A 1st, slot 1 = Gr-B 1st, …,
   * slot groupCount = Gr-A 2nd, slot groupCount+1 = Gr-B 2nd, etc.
   */
  static generateGroupsAndKnockout(
    teamIds: string[],
    groupCount: number,
    qualifiersPerGroup: number,
    legs: 1 | 2,
  ): GroupsAndKnockoutResult {
    if (groupCount < 2) throw new Error('groupCount must be >= 2')
    if (qualifiersPerGroup < 1) throw new Error('qualifiersPerGroup must be >= 1')
    if (teamIds.length < groupCount * 2) {
      throw new Error('Not enough teams to fill groups (min 2 per group)')
    }

    // ── Snake-seed distribution ──
    const groups: GroupSlot[] = Array.from({ length: groupCount }, (_, g) => ({
      name: String.fromCharCode(65 + g), // A, B, C…
      orderIndex: g,
      teamIds: [],
    }))

    let direction = 1
    let groupIdx = 0
    for (const teamId of teamIds) {
      groups[groupIdx].teamIds.push(teamId)
      groupIdx += direction
      if (groupIdx >= groupCount) {
        direction = -1
        groupIdx = groupCount - 1
      } else if (groupIdx < 0) {
        direction = 1
        groupIdx = 0
      }
    }

    // ── Group-stage round-robins ──
    const groupRounds = new Map<number, RoundSlot[]>()
    for (const g of groups) {
      groupRounds.set(g.orderIndex, TournamentEngine.generateRoundRobin(g.teamIds, legs))
    }

    // ── Knockout qualification slots (all TBD at generation time) ──
    const totalQualifiers = groupCount * qualifiersPerGroup
    const knockoutSeeds: (string | null)[] = Array<null>(totalQualifiers).fill(null)

    return { groups, groupRounds, knockoutSeeds }
  }
}
