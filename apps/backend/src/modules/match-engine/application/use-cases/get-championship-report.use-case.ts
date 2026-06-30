import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { MatchAdminDto } from '../dtos/match-admin.dto'

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString()
}

interface MatchAdminRow {
  id: string
  status: string
  home_team_id: string | null
  away_team_id: string | null
  home_team_name: string | null
  home_team_acronym: string | null
  away_team_name: string | null
  away_team_acronym: string | null
  home_score: number
  away_score: number
  scheduled_at: Date | string | null
  started_at: Date | string | null
  ended_at: Date | string | null
  round_id: string
  round_number: number
  round_name: string
  round_phase: string
  group_id: string | null
  bracket_slot: number | null
  is_bye: boolean
}

interface StandingRow {
  id: string
  championship_id: string
  group_id: string | null
  team_id: string
  team_name: string | null
  team_acronym: string | null
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  yellow_cards: number
  red_cards: number
  fair_play_points: number
}

interface PlayerStatRow {
  id: string
  team_id: string
  team_name: string | null
  player_id: string
  player_name: string | null
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

export interface StandingWithTeamDto {
  id: string
  groupId: string | null
  teamId: string
  teamName: string | null
  teamAcronym: string | null
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  yellowCards: number
  redCards: number
  fairPlayPoints: number
}

export interface PlayerStatWithNameDto {
  id: string
  teamId: string
  teamName: string | null
  playerId: string
  playerName: string | null
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

export interface ChampionshipReportDto {
  matches: MatchAdminDto[]
  standings: StandingWithTeamDto[]
  topScorers: PlayerStatWithNameDto[]
  topAssisters: PlayerStatWithNameDto[]
  disciplinary: PlayerStatWithNameDto[]
}

@Injectable()
export class GetChampionshipReportUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId: string): Promise<ChampionshipReportDto> {
    const result = await this.drizzle.runInTenantContext(async (tx) => {
      const matchRows = await tx<MatchAdminRow[]>`
        SELECT
          m.id, m.status,
          m.home_team_id, m.away_team_id,
          m.home_score, m.away_score,
          m.scheduled_at, m.started_at, m.ended_at,
          m.group_id, m.bracket_slot,
          (m.home_team_id IS NULL OR m.away_team_id IS NULL) AS is_bye,
          r.id   AS round_id,
          r.number AS round_number,
          r.name   AS round_name,
          r.phase  AS round_phase,
          ht.name    AS home_team_name,
          ht.acronym AS home_team_acronym,
          at.name    AS away_team_name,
          at.acronym AS away_team_acronym
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        LEFT JOIN teams ht ON ht.id = m.home_team_id
        LEFT JOIN teams at ON at.id = m.away_team_id
        WHERE r.championship_id = ${championshipId}
        ORDER BY r.number ASC, m.bracket_slot ASC NULLS LAST, m.id ASC
      `

      const standingRows = await tx<StandingRow[]>`
        SELECT
          s.id, s.championship_id, s.group_id, s.team_id,
          s.matches_played, s.wins, s.draws, s.losses,
          s.goals_for, s.goals_against, s.goal_difference,
          s.points, s.yellow_cards, s.red_cards, s.fair_play_points,
          t.name    AS team_name,
          t.acronym AS team_acronym
        FROM standings s
        LEFT JOIN teams t ON t.id = s.team_id
        WHERE s.championship_id = ${championshipId}
        ORDER BY s.group_id ASC NULLS LAST, s.points DESC, s.goal_difference DESC, s.goals_for DESC
      `

      const statRows = await tx<PlayerStatRow[]>`
        SELECT
          ps.id, ps.team_id, ps.player_id,
          ps.goals, ps.assists, ps.yellow_cards, ps.red_cards,
          p.full_name AS player_name,
          t.name      AS team_name
        FROM player_statistics ps
        LEFT JOIN players p ON p.id  = ps.player_id
        LEFT JOIN teams   t ON t.id  = ps.team_id
        WHERE ps.championship_id = ${championshipId}
      `

      return { matchRows, standingRows, statRows }
    })

    const matches: MatchAdminDto[] = result.matchRows.map((row) => ({
      id: row.id,
      status: row.status,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name,
      homeTeamAcronym: row.home_team_acronym,
      awayTeamName: row.away_team_name,
      awayTeamAcronym: row.away_team_acronym,
      homeScore: row.home_score,
      awayScore: row.away_score,
      scheduledAt: toIso(row.scheduled_at),
      startedAt: toIso(row.started_at),
      endedAt: toIso(row.ended_at),
      roundId: row.round_id,
      roundNumber: row.round_number,
      roundName: row.round_name,
      roundPhase: row.round_phase,
      groupId: row.group_id,
      bracketSlot: row.bracket_slot,
      isBye: row.is_bye,
    }))

    const standings: StandingWithTeamDto[] = result.standingRows.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      teamId: row.team_id,
      teamName: row.team_name,
      teamAcronym: row.team_acronym,
      matchesPlayed: row.matches_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goal_difference,
      points: row.points,
      yellowCards: row.yellow_cards,
      redCards: row.red_cards,
      fairPlayPoints: row.fair_play_points,
    }))

    const allStats: PlayerStatWithNameDto[] = result.statRows.map((row) => ({
      id: row.id,
      teamId: row.team_id,
      teamName: row.team_name,
      playerId: row.player_id,
      playerName: row.player_name,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellow_cards,
      redCards: row.red_cards,
    }))

    const topScorers = [...allStats]
      .filter((s) => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20)

    const topAssisters = [...allStats]
      .filter((s) => s.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 20)

    const disciplinary = [...allStats]
      .filter((s) => s.yellowCards > 0 || s.redCards > 0)
      .sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3))
      .slice(0, 20)

    return { matches, standings, topScorers, topAssisters, disciplinary }
  }
}
