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
import { CreateChampionshipDto } from '../../application/dtos/create-championship.dto'
import { GenerateFixturesInputDto } from '../../application/dtos/generate-fixtures-input.dto'
import { BracketOutputDto } from '../../application/dtos/bracket-output.dto'
import { CreateChampionshipUseCase } from '../../application/use-cases/create-championship.use-case'
import { GenerateFixturesUseCase } from '../../application/use-cases/generate-fixtures.use-case'
import { GetBracketTreeUseCase } from '../../application/use-cases/get-bracket-tree.use-case'
import { ListChampionshipsUseCase } from '../../application/use-cases/list-championships.use-case'
import { ChampionshipEntity } from '../../domain/entities/championship.entity'

@ApiTags('Championships')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships')
export class ChampionshipController {
  constructor(
    private readonly createChampionship: CreateChampionshipUseCase,
    private readonly generateFixtures: GenerateFixturesUseCase,
    private readonly getBracketTree: GetBracketTreeUseCase,
    private readonly listChampionships: ListChampionshipsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all championships for the tenant' })
  list(): Promise<ChampionshipEntity[]> {
    return this.listChampionships.execute()
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new championship (Organizador only)' })
  create(@Body() dto: CreateChampionshipDto): Promise<ChampionshipEntity> {
    return this.createChampionship.execute(dto)
  }

  @Post(':id/generate-fixtures')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and persist all fixtures for a championship' })
  generateFixturesForChampionship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateFixturesInputDto,
  ): Promise<BracketOutputDto> {
    return this.generateFixtures.execute(id, dto)
  }

  @Get(':id/bracket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve the full bracket / fixture tree' })
  getBracket(@Param('id', ParseUUIDPipe) id: string): Promise<BracketOutputDto> {
    return this.getBracketTree.execute(id)
  }
}
