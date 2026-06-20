import { Module } from '@nestjs/common'
import { DrizzleModule } from '../../database/drizzle.module'
import { AuthModule } from '../auth/auth.module'
import { INVITATION_REPOSITORY } from './domain/repositories/i-invitation.repository'
import { MEMBER_MGMT_REPOSITORY } from './domain/repositories/i-member-mgmt.repository'
import { ORG_MGMT_REPOSITORY } from './domain/repositories/i-org-mgmt.repository'
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case'
import { CancelInvitationUseCase } from './application/use-cases/cancel-invitation.use-case'
import { GetInvitationUseCase } from './application/use-cases/get-invitation.use-case'
import { GetOrganizationUseCase } from './application/use-cases/get-organization.use-case'
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case'
import { ListInvitationsUseCase } from './application/use-cases/list-invitations.use-case'
import { ListMembersUseCase } from './application/use-cases/list-members.use-case'
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case'
import { UpdateMemberRoleUseCase } from './application/use-cases/update-member-role.use-case'
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case'
import { DrizzleInvitationRepository } from './infrastructure/repositories/drizzle-invitation.repository'
import { DrizzleMemberMgmtRepository } from './infrastructure/repositories/drizzle-member-mgmt.repository'
import { DrizzleOrgMgmtRepository } from './infrastructure/repositories/drizzle-org-mgmt.repository'
import { InvitationsController } from './presentation/controllers/invitations.controller'
import { MembersController } from './presentation/controllers/members.controller'
import { OrganizationsController } from './presentation/controllers/organizations.controller'
import { PublicInvitationsController } from './presentation/controllers/public-invitations.controller'

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: ORG_MGMT_REPOSITORY, useClass: DrizzleOrgMgmtRepository },
    { provide: INVITATION_REPOSITORY, useClass: DrizzleInvitationRepository },
    { provide: MEMBER_MGMT_REPOSITORY, useClass: DrizzleMemberMgmtRepository },
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    ListMembersUseCase,
    UpdateMemberRoleUseCase,
    RemoveMemberUseCase,
    InviteMemberUseCase,
    ListInvitationsUseCase,
    CancelInvitationUseCase,
    GetInvitationUseCase,
    AcceptInvitationUseCase,
  ],
  controllers: [
    OrganizationsController,
    MembersController,
    InvitationsController,
    PublicInvitationsController,
  ],
})
export class OrganizationsModule {}
