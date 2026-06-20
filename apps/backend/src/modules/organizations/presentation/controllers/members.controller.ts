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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { MemberWithUser } from '../../domain/repositories/i-member-mgmt.repository'
import { UpdateMemberRoleDto } from '../../application/dtos/update-member-role.dto'
import { ListMembersUseCase } from '../../application/use-cases/list-members.use-case'
import { UpdateMemberRoleUseCase } from '../../application/use-cases/update-member-role.use-case'
import { RemoveMemberUseCase } from '../../application/use-cases/remove-member.use-case'

@ApiTags('Organizations')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('organizations/me/members')
export class MembersController {
  constructor(
    private readonly listMembers: ListMembersUseCase,
    private readonly updateRole: UpdateMemberRoleUseCase,
    private readonly removeMember: RemoveMemberUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all active members of the organization' })
  list(): Promise<MemberWithUser[]> {
    return this.listMembers.execute()
  }

  @Patch(':memberId/role')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a member role' })
  changeRole(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.updateRole.execute(memberId, dto, user)
  }

  @Delete(':memberId')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  remove(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.removeMember.execute(memberId, user)
  }
}
