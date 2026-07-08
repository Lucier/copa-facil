import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { RegisterPlayerDto } from '../../application/dtos/register-player.dto'
import { JoinTeamUseCase } from '../../application/use-cases/join-team.use-case'

@ApiTags('Team Join')
@ApiSecurity('x-tenant-id')
@Controller('teams/join')
export class TeamJoinController {
  constructor(private readonly joinTeam: JoinTeamUseCase) {}

  @Get(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get team info by invite token (public)' })
  async getTeam(@Param('token') token: string) {
    const team = await this.joinTeam.getTeamByToken(token)
    return {
      id: team.id,
      name: team.name,
      acronym: team.acronym,
      city: team.city,
      nickname: team.nickname,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
    }
  }

  @Post(':token')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Self-register as a player in a team via invite token (public)' })
  async join(@Param('token') token: string, @Body() dto: RegisterPlayerDto) {
    const { team, player } = await this.joinTeam.execute(token, dto)
    return {
      message: `Você foi cadastrado com sucesso no time ${team.name}!`,
      player: {
        id: player.id,
        fullName: player.fullName,
        jerseyNumber: player.jerseyNumber,
        mainPosition: player.mainPosition,
      },
    }
  }
}
