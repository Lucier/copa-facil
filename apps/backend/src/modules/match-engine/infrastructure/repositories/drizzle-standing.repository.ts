import { Injectable } from '@nestjs/common'
import { DrizzleService } from '../../../../database/drizzle.service'
import { StandingEntity } from '../../domain/entities/standing.entity'
import {
  IStandingRepository,
  UpsertStandingData,
} from '../../domain/repositories/i-standing.repository'

interface StandingRow {
  id: string
  championship_id: string
  group_id: string | null
  team_id: string
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
  extra_points: number
  updated_at: Date
}

function toEntity(row: StandingRow): StandingEntity {
  return new StandingEntity(
    row.id,
    row.championship_id,
    row.group_id,
    row.team_id,
    row.matches_played,
    row.wins,
    row.draws,
    row.losses,
    row.goals_for,
    row.goals_against,
    row.goal_difference,
    row.points,
    row.yellow_cards,
    row.red_cards,
    row.fair_play_points,
    row.extra_points,
    row.updated_at,
  )
}

@Injectable()
export class DrizzleStandingRepository implements IStandingRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByChampionshipId(championshipId: string): Promise<StandingEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StandingRow[]>`
        SELECT id, championship_id, group_id, team_id, matches_played, wins, draws, losses,
               goals_for, goals_against, goal_difference, points,
               yellow_cards, red_cards, fair_play_points, extra_points, updated_at
        FROM standings
        WHERE championship_id = ${championshipId}
        ORDER BY points DESC, goal_difference DESC, goals_for DESC
      `
    })
    return rows.map(toEntity)
  }

  async findByChampionshipAndGroup(
    championshipId: string,
    groupId: string,
  ): Promise<StandingEntity[]> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StandingRow[]>`
        SELECT id, championship_id, group_id, team_id, matches_played, wins, draws, losses,
               goals_for, goals_against, goal_difference, points,
               yellow_cards, red_cards, fair_play_points, extra_points, updated_at
        FROM standings
        WHERE championship_id = ${championshipId} AND group_id = ${groupId}
        ORDER BY points DESC, goal_difference DESC, goals_for DESC
      `
    })
    return rows.map(toEntity)
  }

  async upsert(data: UpsertStandingData): Promise<StandingEntity> {
    const rows = await this.drizzle.runInTenantContext(async (tx) => {
      return tx<StandingRow[]>`
        INSERT INTO standings (
          championship_id, group_id, team_id, matches_played, wins, draws, losses,
          goals_for, goals_against, goal_difference, points,
          yellow_cards, red_cards, fair_play_points, updated_at
        )
        VALUES (
          ${data.championshipId}, ${data.groupId ?? null}, ${data.teamId},
          ${data.matchesPlayed}, ${data.wins}, ${data.draws}, ${data.losses},
          ${data.goalsFor}, ${data.goalsAgainst}, ${data.goalDifference}, ${data.points},
          ${data.yellowCards}, ${data.redCards}, ${data.fairPlayPoints}, NOW()
        )
        ON CONFLICT (championship_id, team_id) DO UPDATE SET
          group_id         = EXCLUDED.group_id,
          matches_played   = EXCLUDED.matches_played,
          wins             = EXCLUDED.wins,
          draws            = EXCLUDED.draws,
          losses           = EXCLUDED.losses,
          goals_for        = EXCLUDED.goals_for,
          goals_against    = EXCLUDED.goals_against,
          goal_difference  = EXCLUDED.goal_difference,
          points           = EXCLUDED.points,
          yellow_cards     = EXCLUDED.yellow_cards,
          red_cards        = EXCLUDED.red_cards,
          fair_play_points = EXCLUDED.fair_play_points,
          updated_at       = NOW()
        RETURNING id, championship_id, group_id, team_id, matches_played, wins, draws, losses,
                  goals_for, goals_against, goal_difference, points,
                  yellow_cards, red_cards, fair_play_points, extra_points, updated_at
      `
    })
    return toEntity(rows[0])
  }

  async upsertMany(data: UpsertStandingData[]): Promise<void> {
    await Promise.all(data.map((d) => this.upsert(d)))
  }
}
