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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import { InviteMemberDto } from '../../application/dtos/invite-member.dto'
import { InviteMemberUseCase } from '../../application/use-cases/invite-member.use-case'
import { ListInvitationsUseCase } from '../../application/use-cases/list-invitations.use-case'
import { CancelInvitationUseCase } from '../../application/use-cases/cancel-invitation.use-case'

@ApiTags('Organizations')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('organizations/me/invitations')
export class InvitationsController {
  constructor(
    private readonly invite: InviteMemberUseCase,
    private readonly listInvitations: ListInvitationsUseCase,
    private readonly cancelInvitation: CancelInvitationUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a user to the organization' })
  create(
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<InvitationEntity> {
    return this.invite.execute(dto, user)
  }

  @Get()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pending invitations' })
  list(): Promise<InvitationEntity[]> {
    return this.listInvitations.execute()
  }

  @Delete(':id')
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cancelInvitation.execute(id)
  }
}
