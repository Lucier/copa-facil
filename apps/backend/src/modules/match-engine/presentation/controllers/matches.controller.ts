import {
  Body,
  Controller,
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
import { ConcludeMatchDto } from '../../application/dtos/conclude-match.dto'
import { ConcludeMatchUseCase } from '../../application/use-cases/conclude-match.use-case'
import { StartMatchUseCase } from '../../application/use-cases/start-match.use-case'
import { MatchEntity } from '../../domain/entities/match.entity'

@ApiTags('Matches')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly startMatch: StartMatchUseCase,
    private readonly concludeMatch: ConcludeMatchUseCase,
  ) {}

  @Post(':id/start')
  @Roles(UserRole.ARBITRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a scheduled match (sets status to live)' })
  start(@Param('id', ParseUUIDPipe) id: string): Promise<MatchEntity> {
    return this.startMatch.execute(id)
  }

  @Post(':id/conclude')
  @Roles(UserRole.ARBITRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conclude a live match with final score' })
  conclude(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConcludeMatchDto,
  ): Promise<MatchEntity> {
    return this.concludeMatch.execute(id, dto)
  }
}
