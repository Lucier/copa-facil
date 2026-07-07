import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InvitationEntity } from '../../domain/entities/invitation.entity'
import {
  IInvitationRepository} from '../../domain/repositories/i-invitation.repository'
import {
  INVITATION_REPOSITORY,
} from '../../domain/repositories/i-invitation.repository'

@Injectable()
export class GetInvitationUseCase {
  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepo: IInvitationRepository,
  ) {}

  async execute(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitationRepo.findByToken(token)
    if (!invitation) throw new NotFoundException('Invitation not found or has expired')
    return invitation
  }
}
