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
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { OpenSumulaDto } from '../../application/dtos/open-sumula.dto'
import { AddLineupDto } from '../../application/dtos/add-lineup.dto'
import { AddOfficialDto } from '../../application/dtos/add-official.dto'
import { UpdateObservationsDto } from '../../application/dtos/update-observations.dto'
import { OpenSumulaUseCase } from '../../application/use-cases/open-sumula.use-case'
import { GetSumulaUseCase, SumulaView } from '../../application/use-cases/get-sumula.use-case'
import { AddPlayerToLineupUseCase } from '../../application/use-cases/add-player-to-lineup.use-case'
import { RemovePlayerFromLineupUseCase } from '../../application/use-cases/remove-player-from-lineup.use-case'
import { AddOfficialUseCase } from '../../application/use-cases/add-official.use-case'
import { UpdateObservationsUseCase } from '../../application/use-cases/update-observations.use-case'
import { CloseSumulaUseCase } from '../../application/use-cases/close-sumula.use-case'
import { RemoveOfficialUseCase } from '../../application/use-cases/remove-official.use-case'
import { SumulaEntity } from '../../domain/entities/sumula.entity'
import { MatchLineupEntity } from '../../domain/entities/match-lineup.entity'
import { MatchOfficialEntity } from '../../domain/entities/match-official.entity'

@ApiTags('Sumula')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('matches/:matchId/sumula')
export class SumulaController {
  constructor(
    private readonly openSumula: OpenSumulaUseCase,
    private readonly getSumula: GetSumulaUseCase,
    private readonly addPlayerToLineup: AddPlayerToLineupUseCase,
    private readonly removePlayerFromLineup: RemovePlayerFromLineupUseCase,
    private readonly addOfficial: AddOfficialUseCase,
    private readonly removeOfficial: RemoveOfficialUseCase,
    private readonly updateObservations: UpdateObservationsUseCase,
    private readonly closeSumula: CloseSumulaUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ARBITRO, UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open the official match report (súmula)' })
  open(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: OpenSumulaDto,
  ): Promise<SumulaEntity> {
    return this.openSumula.execute(matchId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the full sumula with lineup, officials and events' })
  get(@Param('matchId', ParseUUIDPipe) matchId: string): Promise<SumulaView> {
    return this.getSumula.execute(matchId)
  }

  @Post('lineup')
  @Roles(UserRole.ARBITRO, UserRole.COMISSAO_TECNICA)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a player to the match lineup' })
  addLineup(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: AddLineupDto,
  ): Promise<MatchLineupEntity> {
    return this.addPlayerToLineup.execute(matchId, dto)
  }

  @Delete('lineup/:lineupId')
  @Roles(UserRole.ARBITRO, UserRole.COMISSAO_TECNICA)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a player from the match lineup' })
  removeLineup(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('lineupId', ParseUUIDPipe) lineupId: string,
  ): Promise<void> {
    return this.removePlayerFromLineup.execute(matchId, lineupId)
  }

  @Post('officials')
  @Roles(UserRole.ARBITRO, UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a match official (referee, assistant, etc.)' })
  registerOfficial(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: AddOfficialDto,
  ): Promise<MatchOfficialEntity> {
    return this.addOfficial.execute(matchId, dto)
  }

  @Patch('observations')
  @Roles(UserRole.ARBITRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update sumula observations' })
  observations(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: UpdateObservationsDto,
  ): Promise<SumulaEntity> {
    return this.updateObservations.execute(matchId, dto)
  }

  @Delete('officials/:officialId')
  @Roles(UserRole.ARBITRO, UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a match official from the sumula' })
  deleteOfficial(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('officialId', ParseUUIDPipe) officialId: string,
  ): Promise<void> {
    return this.removeOfficial.execute(matchId, officialId)
  }

  @Post('close')
  @Roles(UserRole.ARBITRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close and sign the sumula (generates integrity hash)' })
  close(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<SumulaEntity> {
    return this.closeSumula.execute(matchId, userId)
  }
}
