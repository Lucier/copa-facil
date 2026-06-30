import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { DrizzleService } from '../../../../database/drizzle.service'
import { CreatePhaseDto } from '../../application/dtos/create-phase.dto'
import { CreateRoundManualDto } from '../../application/dtos/create-round-manual.dto'
import { CreateMatchManualDto } from '../../application/dtos/create-match-manual.dto'
import { UpdateMatchManualDto } from '../../application/dtos/update-match-manual.dto'

interface PhaseRow { id: string; name: string; order_index: number; created_at: Date }
interface RoundRow { id: string; name: string; number: number; phase_id: string | null; created_at: Date }
interface MatchRow {
  id: string; round_id: string; home_team_id: string | null; away_team_id: string | null
  status: string; scheduled_at: Date | null; home_score: number; away_score: number
}

@ApiTags('Championships – Structure')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships')
export class StructureController {
  constructor(private readonly drizzle: DrizzleService) {}

  // ─── Championship by ID ──────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a championship by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const [row] = await this.drizzle.runInTenantContext((tx) =>
      tx<{ id: string; name: string; season: string; format: string; legs: number; status: string; logo_url: string | null }[]>`
        SELECT id, name, season, format, legs, status, logo_url, created_at, updated_at
        FROM championships WHERE id = ${id} LIMIT 1
      `,
    )
    if (!row) throw new NotFoundException('Championship not found')
    return row
  }

  // ─── Phases ──────────────────────────────────────────────────────────────────

  @Get(':id/phases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List phases with nested rounds and matches' })
  async getPhases(@Param('id', ParseUUIDPipe) id: string) {
    return this.drizzle.runInTenantContext(async (tx) => {
      const phases = await tx<PhaseRow[]>`
        SELECT id, name, order_index, created_at FROM phases
        WHERE championship_id = ${id}
        ORDER BY order_index ASC, created_at ASC
      `

      const rounds = await tx<RoundRow[]>`
        SELECT id, name, number, phase_id, created_at FROM rounds
        WHERE championship_id = ${id}
        ORDER BY number ASC
      `

      const matches = await tx<MatchRow[]>`
        SELECT id, round_id, home_team_id, away_team_id, status,
               scheduled_at, home_score, away_score
        FROM matches
        WHERE championship_id = ${id}
        ORDER BY created_at ASC
      `

      const matchesByRound: Record<string, MatchRow[]> = {}
      for (const m of matches) {
        ;(matchesByRound[m.round_id] ??= []).push(m)
      }

      const roundsByPhase: Record<string, RoundRow[]> = {}
      const unlinkedRounds: RoundRow[] = []
      for (const r of rounds) {
        if (r.phase_id) {
          ;(roundsByPhase[r.phase_id] ??= []).push(r)
        } else {
          unlinkedRounds.push(r)
        }
      }

      return {
        phases: phases.map((p) => ({
          ...p,
          rounds: (roundsByPhase[p.id] ?? []).map((r) => ({
            ...r,
            matches: matchesByRound[r.id] ?? [],
          })),
        })),
        unlinkedRounds: unlinkedRounds.map((r) => ({
          ...r,
          matches: matchesByRound[r.id] ?? [],
        })),
      }
    })
  }

  @Post(':id/phases')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a phase' })
  async createPhase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePhaseDto,
  ) {
    const [phase] = await this.drizzle.runInTenantContext((tx) =>
      tx<PhaseRow[]>`
        INSERT INTO phases (championship_id, name, order_index)
        VALUES (${id}, ${dto.name}, ${dto.orderIndex ?? 0})
        RETURNING id, name, order_index, created_at
      `,
    )
    return phase
  }

  @Delete(':id/phases/:phaseId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a phase (rounds become unlinked)' })
  async deletePhase(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('phaseId', ParseUUIDPipe) phaseId: string,
  ): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`UPDATE rounds SET phase_id = NULL WHERE phase_id = ${phaseId} AND championship_id = ${id}`
      await tx`DELETE FROM phases WHERE id = ${phaseId} AND championship_id = ${id}`
    })
  }

  // ─── Rounds ──────────────────────────────────────────────────────────────────

  @Post(':id/rounds')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a round manually' })
  async createRound(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRoundManualDto,
  ) {
    const [round] = await this.drizzle.runInTenantContext(async (tx) => {
      const [maxRow] = await tx<{ max: number | null }[]>`
        SELECT MAX(number) AS max FROM rounds WHERE championship_id = ${id}
      `
      const nextNumber = dto.number ?? ((maxRow?.max ?? 0) + 1)
      return tx<RoundRow[]>`
        INSERT INTO rounds (championship_id, name, number, phase_id)
        VALUES (${id}, ${dto.name}, ${nextNumber}, ${dto.phaseId ?? null})
        RETURNING id, name, number, phase_id, created_at
      `
    })
    return round
  }

  @Delete(':id/rounds/:roundId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a round and all its matches' })
  async deleteRound(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE round_id = ${roundId})`
      await tx`DELETE FROM matches WHERE round_id = ${roundId}`
      await tx`DELETE FROM rounds WHERE id = ${roundId}`
    })
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  @Post(':id/rounds/:roundId/matches')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a match inside a round' })
  async createMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: CreateMatchManualDto,
  ) {
    const [match] = await this.drizzle.runInTenantContext((tx) =>
      tx<MatchRow[]>`
        INSERT INTO matches (championship_id, round_id, home_team_id, away_team_id, scheduled_at)
        VALUES (${id}, ${roundId}, ${dto.homeTeamId ?? null}, ${dto.awayTeamId ?? null},
                ${dto.scheduledAt ?? null})
        RETURNING id, round_id, home_team_id, away_team_id, status, scheduled_at, home_score, away_score
      `,
    )
    return match
  }

  @Patch(':id/rounds/:roundId/matches/:matchId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update match teams and/or schedule' })
  async updateMatch(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('roundId', ParseUUIDPipe) _roundId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: UpdateMatchManualDto,
  ) {
    const [updated] = await this.drizzle.runInTenantContext(async (tx) => {
      const [current] = await tx<MatchRow[]>`
        SELECT id, round_id, home_team_id, away_team_id, status, scheduled_at, home_score, away_score
        FROM matches WHERE id = ${matchId} LIMIT 1
      `
      if (!current) return []
      const newHome = dto.homeTeamId !== undefined ? (dto.homeTeamId ?? null) : current.home_team_id
      const newAway = dto.awayTeamId !== undefined ? (dto.awayTeamId ?? null) : current.away_team_id
      const newSched = dto.scheduledAt !== undefined ? (dto.scheduledAt ?? null) : current.scheduled_at
      const newStatus = dto.status ?? current.status
      return tx<MatchRow[]>`
        UPDATE matches
        SET home_team_id = ${newHome}, away_team_id = ${newAway},
            scheduled_at = ${newSched}, status = ${newStatus}
        WHERE id = ${matchId}
        RETURNING id, round_id, home_team_id, away_team_id, status, scheduled_at, home_score, away_score
      `
    })
    return updated
  }

  @Delete(':id/rounds/:roundId/matches/:matchId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a match' })
  async deleteMatch(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('roundId', ParseUUIDPipe) _roundId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ): Promise<void> {
    await this.drizzle.runInTenantContext(async (tx) => {
      await tx`DELETE FROM match_events WHERE match_id = ${matchId}`
      await tx`DELETE FROM matches WHERE id = ${matchId}`
    })
  }
}
