import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { GetStandingsUseCase } from '../../application/use-cases/get-standings.use-case'
import { StandingEntity } from '../../domain/entities/standing.entity'

@ApiTags('Standings')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/standings')
export class StandingsController {
  constructor(private readonly getStandings: GetStandingsUseCase) {}

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
}
