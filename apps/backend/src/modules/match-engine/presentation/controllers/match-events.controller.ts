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
import { RegisterMatchEventDto } from '../../application/dtos/register-match-event.dto'
import { GetMatchEventsUseCase } from '../../application/use-cases/get-match-events.use-case'
import { RegisterMatchEventUseCase } from '../../application/use-cases/register-match-event.use-case'
import { MatchEventEntity } from '../../domain/entities/match-event.entity'

@ApiTags('Match Events')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('matches/:matchId/events')
export class MatchEventsController {
  constructor(
    private readonly registerEvent: RegisterMatchEventUseCase,
    private readonly getEvents: GetMatchEventsUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ARBITRO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a match event (goal, card, substitution, etc.)' })
  register(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: RegisterMatchEventDto,
  ): Promise<MatchEventEntity> {
    return this.registerEvent.execute(matchId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all events for a match' })
  list(@Param('matchId', ParseUUIDPipe) matchId: string): Promise<MatchEventEntity[]> {
    return this.getEvents.execute(matchId)
  }
}
