import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator'
import { JwtPayload } from '../../../auth/application/jwt-payload.interface'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import { GetInvitationUseCase } from '../../application/use-cases/get-invitation.use-case'
import { AcceptInvitationUseCase } from '../../application/use-cases/accept-invitation.use-case'

@ApiTags('Invitations')
@Controller('invitations')
export class PublicInvitationsController {
  constructor(
    private readonly getInvitation: GetInvitationUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
  ) {}

  @Get(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  get(@Param('token') token: string): Promise<InvitationEntity> {
    return this.getInvitation.execute(token)
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Accept an invitation (requires authentication)' })
  accept(
    @Param('token') token: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.acceptInvitation.execute(token, user)
  }
}
