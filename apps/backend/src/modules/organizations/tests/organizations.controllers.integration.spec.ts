import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication} from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { InvitationsController } from '../presentation/controllers/invitations.controller'
import { MembersController } from '../presentation/controllers/members.controller'
import { InviteMemberUseCase } from '../application/use-cases/invite-member.use-case'
import { ListInvitationsUseCase } from '../application/use-cases/list-invitations.use-case'
import { CancelInvitationUseCase } from '../application/use-cases/cancel-invitation.use-case'
import { ListMembersUseCase } from '../application/use-cases/list-members.use-case'
import { UpdateMemberRoleUseCase } from '../application/use-cases/update-member-role.use-case'
import { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'

const INVITE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const MEMBER_ID = 'b1ffc099-1d0b-4ef8-bb6d-6bb9bd380b22'

const mocks = {
  invite: { execute: vi.fn().mockResolvedValue({ id: INVITE_ID, status: 'pending' }) },
  listInvitations: { execute: vi.fn().mockResolvedValue([{ id: INVITE_ID }]) },
  cancelInvitation: { execute: vi.fn().mockResolvedValue(undefined) },
  listMembers: { execute: vi.fn().mockResolvedValue([{ userId: MEMBER_ID, role: 'jogador' }]) },
  updateRole: { execute: vi.fn().mockResolvedValue(undefined) },
  removeMember: { execute: vi.fn().mockResolvedValue(undefined) },
}

const ORGANIZER = { sub: 'org-1', email: 'org@test.com', role: 'organizador', jti: 'jti-1' }
const JOGADOR = { sub: 'jog-1', email: 'jog@test.com', role: 'jogador', jti: 'jti-2' }

async function buildApp(user: typeof ORGANIZER): Promise<INestApplication> {
  const mod = await Test.createTestingModule({
    controllers: [InvitationsController, MembersController],
    providers: [
      { provide: InviteMemberUseCase, useValue: mocks.invite },
      { provide: ListInvitationsUseCase, useValue: mocks.listInvitations },
      { provide: CancelInvitationUseCase, useValue: mocks.cancelInvitation },
      { provide: ListMembersUseCase, useValue: mocks.listMembers },
      { provide: UpdateMemberRoleUseCase, useValue: mocks.updateRole },
      { provide: RemoveMemberUseCase, useValue: mocks.removeMember },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = user
        return true
      },
    })
    .compile()

  const app = mod.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  await app.init()
  return app
}

describe('Organizations controllers (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(ORGANIZER)
  })

  afterAll(() => app.close())

  it('POST /organizations/me/invitations creates an invitation', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations/me/invitations')
      .send({ email: 'novo@test.com', role: 'arbitro' })
    expect(res.status).toBe(201)
    expect(mocks.invite.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'novo@test.com', role: 'arbitro' }),
      ORGANIZER,
    )
  })

  it('POST /organizations/me/invitations rejects bad email and unknown role', async () => {
    const bad1 = await request(app.getHttpServer())
      .post('/organizations/me/invitations')
      .send({ email: 'nao-eh-email', role: 'arbitro' })
    const bad2 = await request(app.getHttpServer())
      .post('/organizations/me/invitations')
      .send({ email: 'ok@test.com', role: 'presidente' })
    expect(bad1.status).toBe(400)
    expect(bad2.status).toBe(400)
  })

  it('GET /organizations/me/invitations lists invitations', async () => {
    const res = await request(app.getHttpServer()).get('/organizations/me/invitations')
    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe(INVITE_ID)
  })

  it('DELETE /organizations/me/invitations/:id returns 204', async () => {
    const res = await request(app.getHttpServer()).delete(
      `/organizations/me/invitations/${INVITE_ID}`,
    )
    expect(res.status).toBe(204)
    expect(mocks.cancelInvitation.execute).toHaveBeenCalledWith(INVITE_ID)
  })

  it('DELETE /organizations/me/invitations/:id rejects non-UUID id', async () => {
    const res = await request(app.getHttpServer()).delete('/organizations/me/invitations/abc')
    expect(res.status).toBe(400)
  })

  it('GET /organizations/me/members lists members', async () => {
    const res = await request(app.getHttpServer()).get('/organizations/me/members')
    expect(res.status).toBe(200)
    expect(res.body[0].userId).toBe(MEMBER_ID)
  })

  it('PATCH /organizations/me/members/:memberId/role returns 204', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/organizations/me/members/${MEMBER_ID}/role`)
      .send({ role: 'comissao_tecnica' })
    expect(res.status).toBe(204)
    expect(mocks.updateRole.execute).toHaveBeenCalledWith(
      MEMBER_ID,
      expect.objectContaining({ role: 'comissao_tecnica' }),
      ORGANIZER,
    )
  })

  it('PATCH /organizations/me/members/:memberId/role rejects unknown role', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/organizations/me/members/${MEMBER_ID}/role`)
      .send({ role: 'gerente' })
    expect(res.status).toBe(400)
  })

  it('DELETE /organizations/me/members/:memberId returns 204', async () => {
    const res = await request(app.getHttpServer()).delete(`/organizations/me/members/${MEMBER_ID}`)
    expect(res.status).toBe(204)
    expect(mocks.removeMember.execute).toHaveBeenCalledWith(MEMBER_ID, ORGANIZER)
  })
})

describe('Organizations controllers – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(JOGADOR)
  })

  afterAll(() => app.close())

  it.each([
    ['post', '/organizations/me/invitations'],
    ['get', '/organizations/me/invitations'],
    ['delete', `/organizations/me/invitations/${INVITE_ID}`],
    ['patch', `/organizations/me/members/${MEMBER_ID}/role`],
    ['delete', `/organizations/me/members/${MEMBER_ID}`],
  ])('%s %s returns 403 for jogador', async (method, url) => {
    const res = await (request(app.getHttpServer()) as any)[method](url).send({
      email: 'x@test.com',
      role: 'arbitro',
    })
    expect(res.status).toBe(403)
  })

  it('GET /organizations/me/members is allowed for any authenticated member', async () => {
    const res = await request(app.getHttpServer()).get('/organizations/me/members')
    expect(res.status).toBe(200)
  })
})
