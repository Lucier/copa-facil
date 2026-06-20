import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { ListMatchesForAdminUseCase } from '../../application/use-cases/list-matches-for-admin.use-case'
import { MatchAdminDto } from '../../application/dtos/match-admin.dto'

@ApiTags('Matches')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships')
export class ChampionshipMatchesController {
  constructor(private readonly listMatchesForAdmin: ListMatchesForAdminUseCase) {}

  @Get(':id/matches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all matches for a championship with enriched team and round data' })
  list(@Param('id', ParseUUIDPipe) id: string): Promise<MatchAdminDto[]> {
    return this.listMatchesForAdmin.execute(id)
  }
}
