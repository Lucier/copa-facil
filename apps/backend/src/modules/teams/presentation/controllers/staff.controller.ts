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
import { AssignStaffDto } from '../../application/dtos/assign-staff.dto'
import { UpdateStaffDto } from '../../application/dtos/update-staff.dto'
import { AssignStaffUseCase } from '../../application/use-cases/assign-staff.use-case'
import { ListStaffUseCase } from '../../application/use-cases/list-staff.use-case'
import { UpdateStaffUseCase } from '../../application/use-cases/update-staff.use-case'
import { RemoveStaffUseCase } from '../../application/use-cases/remove-staff.use-case'
import { StaffMemberEntity } from '../../domain/entities/staff-member.entity'

@ApiTags('Staff')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('teams/:teamId/staff')
export class StaffController {
  constructor(
    private readonly assignStaff: AssignStaffUseCase,
    private readonly listStaff: ListStaffUseCase,
    private readonly updateStaff: UpdateStaffUseCase,
    private readonly removeStaff: RemoveStaffUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a staff member to a team' })
  assign(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: AssignStaffDto,
  ): Promise<StaffMemberEntity> {
    return this.assignStaff.execute(teamId, dto)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all staff members of a team' })
  list(@Param('teamId', ParseUUIDPipe) teamId: string): Promise<StaffMemberEntity[]> {
    return this.listStaff.execute(teamId)
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a staff member' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ): Promise<StaffMemberEntity> {
    return this.updateStaff.execute(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a staff member from a team' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.removeStaff.execute(id)
  }
}
