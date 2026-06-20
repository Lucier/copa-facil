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
import { RegisterPlayerDto } from '../../application/dtos/register-player.dto'
import { UpdatePlayerDto } from '../../application/dtos/update-player.dto'
import { TransferPlayerDto } from '../../application/dtos/transfer-player.dto'
import { DeletePlayerUseCase } from '../../application/use-cases/delete-player.use-case'
import { GetPlayerHistoryUseCase } from '../../application/use-cases/get-player-history.use-case'
import { GetPlayerUseCase } from '../../application/use-cases/get-player.use-case'
import { ListPlayersUseCase } from '../../application/use-cases/list-players.use-case'
import { RegisterPlayerUseCase } from '../../application/use-cases/register-player.use-case'
import { TransferPlayerUseCase } from '../../application/use-cases/transfer-player.use-case'
import { UpdatePlayerUseCase } from '../../application/use-cases/update-player.use-case'
import { PlayerEntity } from '../../domain/entities/player.entity'
import { PlayerHistoryEntity } from '../../domain/entities/player-history.entity'

@ApiTags('Players')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('teams/:teamId/players')
export class PlayersController {
  constructor(
    private readonly registerPlayer: RegisterPlayerUseCase,
    private readonly listPlayers: ListPlayersUseCase,
    private readonly getPlayer: GetPlayerUseCase,
    private readonly updatePlayer: UpdatePlayerUseCase,
    private readonly deletePlayer: DeletePlayerUseCase,
    private readonly transferPlayer: TransferPlayerUseCase,
    private readonly getPlayerHistory: GetPlayerHistoryUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a player on a team' })
  register(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: RegisterPlayerDto,
  ): Promise<PlayerEntity> {
    return this.registerPlayer.execute(teamId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all players on a team' })
  list(@Param('teamId', ParseUUIDPipe) teamId: string): Promise<PlayerEntity[]> {
    return this.listPlayers.execute(teamId)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a player by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<PlayerEntity> {
    return this.getPlayer.execute(id)
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update player information' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlayerDto,
  ): Promise<PlayerEntity> {
    return this.updatePlayer.execute(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a player' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deletePlayer.execute(id)
  }

  @Post(':id/transfer')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer a player to another team' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferPlayerDto,
  ): Promise<PlayerEntity> {
    return this.transferPlayer.execute(id, dto)
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get transfer history for a player' })
  history(@Param('id', ParseUUIDPipe) id: string): Promise<PlayerHistoryEntity[]> {
    return this.getPlayerHistory.execute(id)
  }
}
