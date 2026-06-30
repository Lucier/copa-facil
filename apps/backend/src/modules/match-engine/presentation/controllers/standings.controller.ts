import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { DrizzleService } from '../../../../database/drizzle.service'
import { GetStandingsUseCase } from '../../application/use-cases/get-standings.use-case'
import { StandingEntity } from '../../domain/entities/standing.entity'

class UpdateExtraPointsDto {
  @ApiProperty({ description: 'Pontos extras (PE): bônus positivo ou punição negativa' })
  @Type(() => Number)
  @IsInt()
  extraPoints!: number
}

@ApiTags('Standings')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/standings')
export class StandingsController {
  constructor(
    private readonly getStandings: GetStandingsUseCase,
    private readonly drizzle: DrizzleService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get standings (classificação) for a championship' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by group' })
  list(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Query('groupId') groupId?: string,
  ): Promise<StandingEntity[]> {
    return this.getStandings.execute(championshipId, groupId)
  }

  @Get('full')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full standings: all teams in the championship, including those with no matches yet' })
  async full(@Param('championshipId', ParseUUIDPipe) championshipId: string) {
    return this.drizzle.runInTenantContext((tx) =>
      tx<{
        team_id: string; team_name: string; team_acronym: string | null; team_logo_url: string | null
        group_id: string | null; standing_id: string | null
        matches_played: number; wins: number; draws: number; losses: number
        goals_for: number; goals_against: number; goal_difference: number
        points: number; extra_points: number
      }[]>`
        WITH champ_teams AS (
          SELECT DISTINCT home_team_id AS team_id, NULL::uuid AS group_id
          FROM matches
          WHERE championship_id = ${championshipId} AND home_team_id IS NOT NULL
          UNION
          SELECT DISTINCT away_team_id, NULL::uuid
          FROM matches
          WHERE championship_id = ${championshipId} AND away_team_id IS NOT NULL
          UNION
          SELECT gt.team_id, g.id AS group_id
          FROM group_teams gt
          JOIN groups g ON g.id = gt.group_id
          WHERE g.championship_id = ${championshipId}
        )
        SELECT
          t.id               AS team_id,
          t.name             AS team_name,
          t.acronym          AS team_acronym,
          t.logo_url         AS team_logo_url,
          ct.group_id,
          s.id               AS standing_id,
          COALESCE(s.matches_played,  0) AS matches_played,
          COALESCE(s.wins,            0) AS wins,
          COALESCE(s.draws,           0) AS draws,
          COALESCE(s.losses,          0) AS losses,
          COALESCE(s.goals_for,       0) AS goals_for,
          COALESCE(s.goals_against,   0) AS goals_against,
          COALESCE(s.goal_difference, 0) AS goal_difference,
          COALESCE(s.points,          0) AS points,
          COALESCE(s.extra_points,    0) AS extra_points
        FROM champ_teams ct
        JOIN teams t ON t.id = ct.team_id
        LEFT JOIN standings s
          ON s.championship_id = ${championshipId} AND s.team_id = ct.team_id
        ORDER BY
          COALESCE(s.points, 0) DESC,
          COALESCE(s.goal_difference, 0) DESC,
          COALESCE(s.goals_for, 0) DESC,
          t.name ASC
      `,
    )
  }

  @Patch(':teamId/extra-points')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set extra points (PE) for a team in a championship' })
  async setExtraPoints(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: UpdateExtraPointsDto,
  ) {
    const [row] = await this.drizzle.runInTenantContext((tx) =>
      tx<{ id: string; extra_points: number }[]>`
        UPDATE standings
        SET extra_points = ${dto.extraPoints}, updated_at = NOW()
        WHERE championship_id = ${championshipId} AND team_id = ${teamId}
        RETURNING id, extra_points
      `,
    )
    return row ?? null
  }
}
