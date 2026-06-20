import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { GetTopScorersUseCase } from '../../application/use-cases/get-top-scorers.use-case'
import { PlayerStatisticEntity } from '../../domain/entities/player-statistic.entity'

@ApiTags('Statistics')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/statistics')
export class StatisticsController {
  constructor(private readonly getTopScorers: GetTopScorersUseCase) {}

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
}
