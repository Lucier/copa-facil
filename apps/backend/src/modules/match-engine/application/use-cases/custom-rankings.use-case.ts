import { Inject, Injectable } from '@nestjs/common'
import { IsNumber, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { NotFoundError } from '../../../../shared/errors'
import { DrizzleService } from '../../../../database/drizzle.service'
import {
  IStatisticRepository,
  STATISTIC_REPOSITORY,
} from '../../domain/repositories/i-statistic.repository'

/* ─── DTOs ─── */

export class RankingWeightsDto {
  @ApiProperty({ default: 10 }) @IsNumber() @Min(0) goals: number = 10
  @ApiProperty({ default: 7 })  @IsNumber() @Min(0) assists: number = 7
  @ApiProperty({ default: 2 })  @IsNumber() @Min(0) yellowCardPenalty: number = 2
  @ApiProperty({ default: 5 })  @IsNumber() @Min(0) redCardPenalty: number = 5
  @ApiProperty({ default: 1 })  @IsNumber() @Min(0) matchesPlayed: number = 1
}

export class CreateCustomRankingDto {
  @ApiProperty() @IsString() name!: string
  @ApiProperty({ type: RankingWeightsDto }) weights!: RankingWeightsDto
}

/* ─── Stored shape ─── */

export interface CustomRankingRow {
  id: string
  championship_id: string
  name: string
  weights: RankingWeightsDto
  created_at: Date
}

export interface CustomRankingDto {
  id: string
  championshipId: string
  name: string
  weights: RankingWeightsDto
  createdAt: string
}

/* ─── Computed result ─── */

export interface CustomRankingEntryDto {
  rank: number
  playerId: string
  playerName: string | null
  teamId: string
  teamName: string | null
  score: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  matchesPlayed: number  // from player_statistics — not directly available; we'll use goals+assists based proxy
}

/* ─── Use Cases ─── */

@Injectable()
export class CreateCustomRankingUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId: string, dto: CreateCustomRankingDto): Promise<CustomRankingDto> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<CustomRankingRow[]>`
        INSERT INTO custom_rankings (championship_id, name, weights)
        VALUES (${championshipId}, ${dto.name}, ${JSON.stringify(dto.weights)})
        RETURNING *
      `,
    )
    const r = rows[0]
    return { id: r.id, championshipId: r.championship_id, name: r.name, weights: r.weights, createdAt: new Date(r.created_at).toISOString() }
  }
}

@Injectable()
export class ListCustomRankingsUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(championshipId: string): Promise<CustomRankingDto[]> {
    const rows = await this.drizzle.runInTenantContext((tx) =>
      tx<CustomRankingRow[]>`
        SELECT * FROM custom_rankings WHERE championship_id = ${championshipId} ORDER BY created_at DESC
      `,
    )
    return rows.map((r) => ({
      id: r.id, championshipId: r.championship_id, name: r.name, weights: r.weights,
      createdAt: new Date(r.created_at).toISOString(),
    }))
  }
}

@Injectable()
export class DeleteCustomRankingUseCase {
  constructor(private readonly drizzle: DrizzleService) {}

  async execute(rankingId: string): Promise<void> {
    await this.drizzle.runInTenantContext((tx) =>
      tx`DELETE FROM custom_rankings WHERE id = ${rankingId}`,
    )
  }
}

@Injectable()
export class ComputeCustomRankingUseCase {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(STATISTIC_REPOSITORY) private readonly statRepo: IStatisticRepository,
  ) {}

  async execute(rankingId: string): Promise<CustomRankingEntryDto[]> {
    const rankingRows = await this.drizzle.runInTenantContext((tx) =>
      tx<CustomRankingRow[]>`SELECT * FROM custom_rankings WHERE id = ${rankingId} LIMIT 1`,
    )
    if (!rankingRows[0]) throw new NotFoundError('CustomRanking', rankingId)
    const ranking = rankingRows[0]
    const w = ranking.weights as RankingWeightsDto

    interface StatWithName {
      id: string; team_id: string; team_name: string | null; player_id: string; player_name: string | null
      goals: number; assists: number; yellow_cards: number; red_cards: number
    }

    const stats = await this.drizzle.runInTenantContext((tx) =>
      tx<StatWithName[]>`
        SELECT ps.id, ps.team_id, ps.player_id, ps.goals, ps.assists, ps.yellow_cards, ps.red_cards,
               p.full_name AS player_name, t.name AS team_name
        FROM player_statistics ps
        LEFT JOIN players p ON p.id = ps.player_id
        LEFT JOIN teams   t ON t.id = ps.team_id
        WHERE ps.championship_id = ${ranking.championship_id}
      `,
    )

    const scored = stats
      .map((s) => {
        const score =
          s.goals * w.goals
          + s.assists * w.assists
          - s.yellow_cards * w.yellowCardPenalty
          - s.red_cards * w.redCardPenalty
        return { ...s, score }
      })
      .sort((a, b) => b.score - a.score)

    return scored.map((s, i) => ({
      rank: i + 1,
      playerId: s.player_id,
      playerName: s.player_name,
      teamId: s.team_id,
      teamName: s.team_name,
      score: Math.round(s.score * 10) / 10,
      goals: s.goals,
      assists: s.assists,
      yellowCards: s.yellow_cards,
      redCards: s.red_cards,
      matchesPlayed: 0,
    }))
  }
}
