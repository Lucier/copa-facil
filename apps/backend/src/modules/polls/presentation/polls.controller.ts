import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../auth/presentation/decorators/roles.decorator'
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator'
import { UserRole } from '../../auth/domain/roles.enum'
import {
  CreatePollDto, VotePollDto,
  CreatePollUseCase, ListPollsUseCase, GetPollResultsUseCase,
  PublishPollUseCase, ClosePollUseCase, VotePollUseCase,
} from '../application/use-cases/polls.use-cases'

@ApiTags('Polls')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/polls')
export class PollsController {
  constructor(
    private readonly create: CreatePollUseCase,
    private readonly list: ListPollsUseCase,
    private readonly getResults: GetPollResultsUseCase,
    private readonly publish: PublishPollUseCase,
    private readonly closePoll: ClosePollUseCase,
    private readonly vote: VotePollUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a poll (draft) — Organizador only' })
  createPoll(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Body() dto: CreatePollDto,
  ) {
    return this.create.execute(championshipId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all polls for a championship' })
  listPolls(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.list.execute(championshipId, userId)
  }

  @Get(':pollId/results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get results for a specific poll' })
  results(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.getResults.execute(pollId, userId)
  }

  @Post(':pollId/publish')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft poll — Organizador only' })
  publishPoll(@Param('pollId', ParseUUIDPipe) pollId: string) {
    return this.publish.execute(pollId)
  }

  @Post(':pollId/close')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close an active poll — Organizador only' })
  closeIt(@Param('pollId', ParseUUIDPipe) pollId: string) {
    return this.closePoll.execute(pollId)
  }

  @Post(':pollId/vote')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Vote on a poll option' })
  castVote(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Body() dto: VotePollDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.vote.execute(pollId, dto, userId)
  }
}
