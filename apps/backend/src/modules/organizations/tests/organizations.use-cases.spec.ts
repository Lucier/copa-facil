import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { TenantContext } from '../../../infrastructure/tenant/tenant-context'
import { UserRole } from '../../auth/domain/roles.enum'
import type { JwtPayload } from '../../auth/application/jwt-payload.interface'
import { AcceptInvitationUseCase } from '../application/use-cases/accept-invitation.use-case'
import { CancelInvitationUseCase } from '../application/use-cases/cancel-invitation.use-case'
import { GetInvitationUseCase } from '../application/use-cases/get-invitation.use-case'
import { GetOrganizationUseCase } from '../application/use-cases/get-organization.use-case'
import { InviteMemberUseCase } from '../application/use-cases/invite-member.use-case'
import { ListInvitationsUseCase } from '../application/use-cases/list-invitations.use-case'
import { ListMembersUseCase } from '../application/use-cases/list-members.use-case'
import { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case'
import { UpdateMemberRoleUseCase } from '../application/use-cases/update-member-role.use-case'
import { UpdateOrganizationUseCase } from '../application/use-cases/update-organization.use-case'
import { InvitationEntity } from '../domain/entities/invitation.entity'
import { OrganizationEntity } from '../domain/entities/organization.entity'
import { InvitationStatus } from '../domain/enums/invitation-status.enum'

const currentUser: JwtPayload = { sub: 'user-1', email: 'user@test.com', jti: 'jti-1' }

const org = new OrganizationEntity('org-1', 'Liga', 'liga', 'tenant_liga', new Date(), new Date())

function makeInvitation(overrides: Partial<InvitationEntity> = {}): InvitationEntity {
  const future = new Date(Date.now() + 86_400_000)
  return new InvitationEntity(
    overrides.id ?? 'inv-1',
    overrides.orgId ?? 'org-1',
    overrides.email ?? 'user@test.com',
    overrides.role ?? UserRole.TORCEDOR,
    overrides.token ?? 'token-1',
    overrides.status ?? InvitationStatus.PENDING,
    overrides.invitedBy ?? 'user-9',
    overrides.expiresAt ?? future,
    new Date(),
  )
}

function makeRepos() {
  return {
    invitationRepo: {
      findByToken: vi.fn(),
      findById: vi.fn(),
      findByOrgId: vi.fn(),
      findActiveByEmail: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    },
    orgRepo: {
      findById: vi.fn(),
      findBySchemaName: vi.fn(),
      update: vi.fn(),
    },
    memberRepo: {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      listActive: vi.fn(),
      countByRole: vi.fn(),
      updateRole: vi.fn(),
      deactivate: vi.fn(),
    },
  }
}

const inTenant = <T>(fn: () => Promise<T>) => TenantContext.run('tenant_liga', fn)

describe('AcceptInvitationUseCase', () => {
  let repos: ReturnType<typeof makeRepos>
  let useCase: AcceptInvitationUseCase

  beforeEach(() => {
    repos = makeRepos()
    useCase = new AcceptInvitationUseCase(
      repos.invitationRepo as never,
      repos.orgRepo as never,
      repos.memberRepo as never,
    )
  })

  it('creates membership and marks invitation accepted', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(makeInvitation())
    repos.orgRepo.findById.mockResolvedValue(org)
    repos.memberRepo.findByUserId.mockResolvedValue(null)

    await useCase.execute('token-1', currentUser)

    expect(repos.memberRepo.create).toHaveBeenCalledWith('user-1', UserRole.TORCEDOR)
    expect(repos.invitationRepo.updateStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.ACCEPTED)
  })

  it('rejects unknown token', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(null)
    await expect(useCase.execute('nope', currentUser)).rejects.toThrow(NotFoundException)
  })

  it('rejects expired invitation', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(
      makeInvitation({ expiresAt: new Date(Date.now() - 1000) }),
    )
    await expect(useCase.execute('token-1', currentUser)).rejects.toThrow(BadRequestException)
  })

  it('rejects cancelled invitation', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(
      makeInvitation({ status: InvitationStatus.CANCELLED }),
    )
    await expect(useCase.execute('token-1', currentUser)).rejects.toThrow(BadRequestException)
  })

  it('rejects invitation addressed to another email', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(makeInvitation({ email: 'other@test.com' }))
    await expect(useCase.execute('token-1', currentUser)).rejects.toThrow(ForbiddenException)
  })

  it('accepts case-insensitive email match', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(makeInvitation({ email: 'USER@Test.com' }))
    repos.orgRepo.findById.mockResolvedValue(org)
    repos.memberRepo.findByUserId.mockResolvedValue(null)
    await expect(useCase.execute('token-1', currentUser)).resolves.toBeUndefined()
  })

  it('rejects if the user is already a member', async () => {
    repos.invitationRepo.findByToken.mockResolvedValue(makeInvitation())
    repos.orgRepo.findById.mockResolvedValue(org)
    repos.memberRepo.findByUserId.mockResolvedValue({ id: 'm-1' })
    await expect(useCase.execute('token-1', currentUser)).rejects.toThrow(BadRequestException)
    expect(repos.invitationRepo.updateStatus).not.toHaveBeenCalled()
  })
})

describe('InviteMemberUseCase', () => {
  let repos: ReturnType<typeof makeRepos>
  let useCase: InviteMemberUseCase

  beforeEach(() => {
    repos = makeRepos()
    useCase = new InviteMemberUseCase(repos.orgRepo as never, repos.invitationRepo as never)
  })

  it('creates an invitation with token and 7-day expiry', async () => {
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
    repos.invitationRepo.findActiveByEmail.mockResolvedValue(null)
    repos.invitationRepo.create.mockImplementation((data) => Promise.resolve(data))

    const result = await inTenant(() =>
      useCase.execute({ email: 'novo@test.com', role: UserRole.ARBITRO }, currentUser),
    )

    expect(repos.orgRepo.findBySchemaName).toHaveBeenCalledWith('tenant_liga')
    expect(result.token).toMatch(/^[0-9a-f]{64}$/)
    const days = (result.expiresAt.getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(6.9)
    expect(days).toBeLessThanOrEqual(7)
  })

  it('rejects duplicate active invitation', async () => {
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
    repos.invitationRepo.findActiveByEmail.mockResolvedValue(makeInvitation())
    await expect(
      inTenant(() => useCase.execute({ email: 'user@test.com', role: UserRole.TORCEDOR }, currentUser)),
    ).rejects.toThrow(ConflictException)
  })

  it('rejects when organization is missing', async () => {
    repos.orgRepo.findBySchemaName.mockResolvedValue(null)
    await expect(
      inTenant(() => useCase.execute({ email: 'a@b.com', role: UserRole.TORCEDOR }, currentUser)),
    ).rejects.toThrow(NotFoundException)
  })
})

describe('CancelInvitationUseCase', () => {
  let repos: ReturnType<typeof makeRepos>
  let useCase: CancelInvitationUseCase

  beforeEach(() => {
    repos = makeRepos()
    useCase = new CancelInvitationUseCase(repos.orgRepo as never, repos.invitationRepo as never)
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
  })

  it('cancels a pending invitation', async () => {
    repos.invitationRepo.findById.mockResolvedValue(makeInvitation())
    await inTenant(() => useCase.execute('inv-1'))
    expect(repos.invitationRepo.updateStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.CANCELLED)
  })

  it('hides invitations from other organizations', async () => {
    repos.invitationRepo.findById.mockResolvedValue(makeInvitation({ orgId: 'other-org' }))
    await expect(inTenant(() => useCase.execute('inv-1'))).rejects.toThrow(NotFoundException)
  })

  it('rejects non-pending invitations', async () => {
    repos.invitationRepo.findById.mockResolvedValue(
      makeInvitation({ status: InvitationStatus.ACCEPTED }),
    )
    await expect(inTenant(() => useCase.execute('inv-1'))).rejects.toThrow(BadRequestException)
  })
})

describe('GetInvitationUseCase / ListInvitationsUseCase / ListMembersUseCase', () => {
  it('returns invitation by token or 404', async () => {
    const repos = makeRepos()
    const useCase = new GetInvitationUseCase(repos.invitationRepo as never)
    const invitation = makeInvitation()
    repos.invitationRepo.findByToken.mockResolvedValue(invitation)
    expect(await useCase.execute('token-1')).toBe(invitation)

    repos.invitationRepo.findByToken.mockResolvedValue(null)
    await expect(useCase.execute('x')).rejects.toThrow(NotFoundException)
  })

  it('lists pending invitations for the current org', async () => {
    const repos = makeRepos()
    const useCase = new ListInvitationsUseCase(repos.orgRepo as never, repos.invitationRepo as never)
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
    repos.invitationRepo.findByOrgId.mockResolvedValue([makeInvitation()])
    const result = await inTenant(() => useCase.execute())
    expect(repos.invitationRepo.findByOrgId).toHaveBeenCalledWith('org-1', InvitationStatus.PENDING)
    expect(result).toHaveLength(1)
  })

  it('lists active members', async () => {
    const repos = makeRepos()
    const useCase = new ListMembersUseCase(repos.memberRepo as never)
    repos.memberRepo.listActive.mockResolvedValue([{ id: 'm-1' }])
    expect(await useCase.execute()).toEqual([{ id: 'm-1' }])
  })
})

describe('RemoveMemberUseCase', () => {
  let repos: ReturnType<typeof makeRepos>
  let useCase: RemoveMemberUseCase

  beforeEach(() => {
    repos = makeRepos()
    useCase = new RemoveMemberUseCase(repos.memberRepo as never)
  })

  it('deactivates a member', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.TORCEDOR })
    await useCase.execute('m-1', currentUser)
    expect(repos.memberRepo.deactivate).toHaveBeenCalledWith('m-1')
  })

  it('prevents removing yourself', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-1', role: UserRole.TORCEDOR })
    await expect(useCase.execute('m-1', currentUser)).rejects.toThrow(ForbiddenException)
  })

  it('prevents removing the last organizador', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.ORGANIZADOR })
    repos.memberRepo.countByRole.mockResolvedValue(1)
    await expect(useCase.execute('m-1', currentUser)).rejects.toThrow(BadRequestException)
  })

  it('allows removing an organizador when another one remains', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.ORGANIZADOR })
    repos.memberRepo.countByRole.mockResolvedValue(2)
    await useCase.execute('m-1', currentUser)
    expect(repos.memberRepo.deactivate).toHaveBeenCalledWith('m-1')
  })

  it('404 for unknown member', async () => {
    repos.memberRepo.findById.mockResolvedValue(null)
    await expect(useCase.execute('x', currentUser)).rejects.toThrow(NotFoundException)
  })
})

describe('UpdateMemberRoleUseCase', () => {
  let repos: ReturnType<typeof makeRepos>
  let useCase: UpdateMemberRoleUseCase

  beforeEach(() => {
    repos = makeRepos()
    useCase = new UpdateMemberRoleUseCase(repos.memberRepo as never)
  })

  it('updates the role', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.TORCEDOR })
    await useCase.execute('m-1', { role: UserRole.ARBITRO }, currentUser)
    expect(repos.memberRepo.updateRole).toHaveBeenCalledWith('m-1', UserRole.ARBITRO)
  })

  it('prevents changing your own role', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-1', role: UserRole.TORCEDOR })
    await expect(useCase.execute('m-1', { role: UserRole.ARBITRO }, currentUser)).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('prevents demoting the last organizador', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.ORGANIZADOR })
    repos.memberRepo.countByRole.mockResolvedValue(1)
    await expect(useCase.execute('m-1', { role: UserRole.TORCEDOR }, currentUser)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('allows keeping organizador role even when last', async () => {
    repos.memberRepo.findById.mockResolvedValue({ id: 'm-1', userId: 'user-2', role: UserRole.ORGANIZADOR })
    await useCase.execute('m-1', { role: UserRole.ORGANIZADOR }, currentUser)
    expect(repos.memberRepo.updateRole).toHaveBeenCalledWith('m-1', UserRole.ORGANIZADOR)
  })
})

describe('GetOrganizationUseCase / UpdateOrganizationUseCase', () => {
  it('returns the organization for the current tenant', async () => {
    const repos = makeRepos()
    const useCase = new GetOrganizationUseCase(repos.orgRepo as never)
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
    expect(await inTenant(() => useCase.execute())).toBe(org)
    expect(repos.orgRepo.findBySchemaName).toHaveBeenCalledWith('tenant_liga')
  })

  it('404 when tenant has no organization', async () => {
    const repos = makeRepos()
    const useCase = new GetOrganizationUseCase(repos.orgRepo as never)
    repos.orgRepo.findBySchemaName.mockResolvedValue(null)
    await expect(inTenant(() => useCase.execute())).rejects.toThrow(NotFoundException)
  })

  it('updates the organization name', async () => {
    const repos = makeRepos()
    const useCase = new UpdateOrganizationUseCase(repos.orgRepo as never)
    repos.orgRepo.findBySchemaName.mockResolvedValue(org)
    repos.orgRepo.update.mockResolvedValue({ ...org, name: 'Nova Liga' })
    const result = await inTenant(() => useCase.execute({ name: 'Nova Liga' }))
    expect(repos.orgRepo.update).toHaveBeenCalledWith('org-1', { name: 'Nova Liga' })
    expect(result.name).toBe('Nova Liga')
  })
})
