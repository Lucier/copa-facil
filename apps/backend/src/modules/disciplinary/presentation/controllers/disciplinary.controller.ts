import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { CreateSuspensionDto } from '../../application/dtos/create-suspension.dto'
import { CreateSuspensionUseCase } from '../../application/use-cases/create-suspension.use-case'
import {
  ListSuspensionsUseCase,
  SuspensionWithDetailsDto,
} from '../../application/use-cases/list-suspensions.use-case'
import { ServeSuspensionUseCase } from '../../application/use-cases/serve-suspension.use-case'
import { CancelSuspensionUseCase } from '../../application/use-cases/cancel-suspension.use-case'

@ApiTags('Disciplinary')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('championships/:championshipId/suspensions')
export class DisciplinaryController {
  constructor(
    private readonly createSuspension: CreateSuspensionUseCase,
    private readonly listSuspensions: ListSuspensionsUseCase,
    private readonly serveSuspension: ServeSuspensionUseCase,
    private readonly cancelSuspension: CancelSuspensionUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List suspensions for a championship' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status: ativa | cumprida | cancelada' })
  list(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Query('status') status?: string,
  ): Promise<SuspensionWithDetailsDto[]> {
    return this.listSuspensions.execute(championshipId, status)
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manual suspension (Organizador only)' })
  create(
    @Param('championshipId', ParseUUIDPipe) championshipId: string,
    @Body() dto: CreateSuspensionDto,
  ) {
    return this.createSuspension.execute(championshipId, dto)
  }

  @Post(':id/serve')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one match served for a suspension (Organizador only)' })
  serve(@Param('id', ParseUUIDPipe) id: string) {
    return this.serveSuspension.execute(id)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a suspension (Organizador only)' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.cancelSuspension.execute(id)
  }
}
