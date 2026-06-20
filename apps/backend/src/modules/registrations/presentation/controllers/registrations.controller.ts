import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { ReviewTeamDto } from '../../application/dtos/review-team.dto'
import { SubmitRegistrationDto } from '../../application/dtos/submit-registration.dto'
import { ApproveTeamUseCase } from '../../application/use-cases/approve-team.use-case'
import { GetRegistrationUseCase } from '../../application/use-cases/get-registration.use-case'
import { ListRegistrationsUseCase } from '../../application/use-cases/list-registrations.use-case'
import { RejectTeamUseCase } from '../../application/use-cases/reject-team.use-case'
import { SubmitRegistrationUseCase } from '../../application/use-cases/submit-registration.use-case'

@ApiTags('Registrations')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(
    private readonly submit: SubmitRegistrationUseCase,
    private readonly list: ListRegistrationsUseCase,
    private readonly getOne: GetRegistrationUseCase,
    private readonly approve: ApproveTeamUseCase,
    private readonly reject: RejectTeamUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a team registration for a championship' })
  create(@Body() dto: SubmitRegistrationDto, @CurrentUser('sub') userId: string) {
    return this.submit.execute(dto, userId)
  }

  @Get()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'List all registrations for a championship' })
  @ApiQuery({ name: 'championshipId', required: true })
  listAll(@Query('championshipId') championshipId: string) {
    return this.list.execute(championshipId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getOne.execute(id)
  }

  @Patch(':id/approve')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a team registration' })
  approveOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewTeamDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.approve.execute(id, dto, userId)
  }

  @Patch(':id/reject')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a team registration' })
  rejectOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewTeamDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.reject.execute(id, dto, userId)
  }
}
