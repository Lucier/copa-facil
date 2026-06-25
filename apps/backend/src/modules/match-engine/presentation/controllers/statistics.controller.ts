import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { GetTopScorersUseCase } from '../../application/use-cases/get-top-scorers.use-case'
import {
  GetChampionshipReportUseCase,
  ChampionshipReportDto,
} from '../../application/use-cases/get-championship-report.use-case'
import {
  CreateCustomRankingDto,
  CreateCustomRankingUseCase,
  ListCustomRankingsUseCase,
  DeleteCustomRankingUseCase,
  ComputeCustomRankingUseCase,
} from '../../application/use-cases/custom-rankings.use-case'
import { PlayerStatisticEntity } from '../../domain/entities/player-statistic.entity'

@ApiTags('Statistics')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/statistics')
export class StatisticsController {
  constructor(
    private readonly getTopScorers: GetTopScorersUseCase,
    private readonly getReport: GetChampionshipReportUseCase,
    private readonly createRanking: CreateCustomRankingUseCase,
    private readonly listRankings: ListCustomRankingsUseCase,
    private readonly deleteRanking: DeleteCustomRankingUseCase,
    private readonly computeRanking: ComputeCustomRankingUseCase,
  ) {}

  @Get('top-scorers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Artilharia — players ranked by goals' })
  topScorers(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
  ): Promise<PlayerStatisticEntity[]> {
    return this.getTopScorers.execute(championshipId, 'goals')
  }

  @Get('assists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Líderes de assistências — players ranked by assists' })
  assists(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
  ): Promise<PlayerStatisticEntity[]> {
    return this.getTopScorers.execute(championshipId, 'assists')
  }

  @Get('fair-play')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fair Play Index — players ranked by lowest penalty points' })
  fairPlay(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
  ): Promise<PlayerStatisticEntity[]> {
    return this.getTopScorers.execute(championshipId, 'fair_play')
  }

  @Get('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full championship report — matches, standings, scorers, disciplinary' })
  report(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
  ): Promise<ChampionshipReportDto> {
    return this.getReport.execute(championshipId)
  }

  /* ── Custom Rankings ── */

  @Get('rankings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List saved custom rankings for a championship' })
  getRankings(@Param('championshipId', ParseUUIDPipe) championshipId: string) {
    return this.listRankings.execute(championshipId)
  }

  @Post('rankings')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom ranking with weights (Organizador only)' })
  createCustomRanking(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Body() dto: CreateCustomRankingDto,
  ) {
    return this.createRanking.execute(championshipId, dto)
  }

  @Get('rankings/:rankingId/compute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compute the custom ranking results' })
  computeCustomRanking(@Param('rankingId', ParseUUIDPipe) rankingId: string) {
    return this.computeRanking.execute(rankingId)
  }

  @Delete('rankings/:rankingId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom ranking (Organizador only)' })
  deleteCustomRanking(@Param('rankingId', ParseUUIDPipe) rankingId: string) {
    return this.deleteRanking.execute(rankingId)
  }
}
