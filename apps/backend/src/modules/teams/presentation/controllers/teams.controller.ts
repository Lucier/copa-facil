import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateTeamDto } from '../../application/dtos/create-team.dto'
import { UpdateTeamDto } from '../../application/dtos/update-team.dto'
import { CreateTeamUseCase } from '../../application/use-cases/create-team.use-case'
import { DeleteTeamUseCase } from '../../application/use-cases/delete-team.use-case'
import { GetTeamUseCase } from '../../application/use-cases/get-team.use-case'
import { ListTeamsUseCase } from '../../application/use-cases/list-teams.use-case'
import { UpdateTeamUseCase } from '../../application/use-cases/update-team.use-case'
import { TeamEntity } from '../../domain/entities/team.entity'

@ApiTags('Teams')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly createTeam: CreateTeamUseCase,
    private readonly listTeams: ListTeamsUseCase,
    private readonly getTeam: GetTeamUseCase,
    private readonly updateTeam: UpdateTeamUseCase,
    private readonly deleteTeam: DeleteTeamUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new team' })
  create(@Body() dto: CreateTeamDto): Promise<TeamEntity> {
    return this.createTeam.execute(dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all teams in the tenant' })
  list(): Promise<TeamEntity[]> {
    return this.listTeams.execute()
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a team by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeamEntity> {
    return this.getTeam.execute(id)
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a team' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamEntity> {
    return this.updateTeam.execute(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteTeam.execute(id)
  }
}
