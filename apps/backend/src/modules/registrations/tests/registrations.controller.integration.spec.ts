import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication} from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { RegistrationsController } from '../presentation/controllers/registrations.controller'
import { SubmitRegistrationUseCase } from '../application/use-cases/submit-registration.use-case'
import { ListRegistrationsUseCase } from '../application/use-cases/list-registrations.use-case'
import { GetRegistrationUseCase } from '../application/use-cases/get-registration.use-case'
import { ApproveTeamUseCase } from '../application/use-cases/approve-team.use-case'
import { RejectTeamUseCase } from '../application/use-cases/reject-team.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../auth/presentation/guards/tenant-roles.guard'
import { RegistrationStatus } from '../domain/enums'

const CHAMPIONSHIP_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const TEAM_ID = 'b1ffc099-1d0b-4ef8-bb6d-6bb9bd380b22'
const REG_ID = 'c2ffd199-2e0b-4ef8-bb6d-6bb9bd380c33'

const PENDING_REG = {
  id: REG_ID,
  championshipId: CHAMPIONSHIP_ID,
  teamId: TEAM_ID,
  status: RegistrationStatus.PENDENTE,
}
const APPROVED_REG = { ...PENDING_REG, status: RegistrationStatus.APROVADO }
const REJECTED_REG = { ...PENDING_REG, status: RegistrationStatus.REJEITADO }

const mockSubmit = { execute: vi.fn().mockResolvedValue(PENDING_REG) }
const mockList = { execute: vi.fn().mockResolvedValue([PENDING_REG]) }
const mockGet = { execute: vi.fn().mockResolvedValue(PENDING_REG) }
const mockApprove = { execute: vi.fn().mockResolvedValue(APPROVED_REG) }
const mockReject = { execute: vi.fn().mockResolvedValue(REJECTED_REG) }

const ORGANIZER = { sub: 'org-1', email: 'org@test.com', role: 'organizador', jti: 'jti-1' }
const PLAYER = { sub: 'jog-1', email: 'jog@test.com', role: 'jogador', jti: 'jti-2' }

function buildModule(user: typeof ORGANIZER) {
  return Test.createTestingModule({
    controllers: [RegistrationsController],
    providers: [
      { provide: SubmitRegistrationUseCase, useValue: mockSubmit },
      { provide: ListRegistrationsUseCase, useValue: mockList },
      { provide: GetRegistrationUseCase, useValue: mockGet },
      { provide: ApproveTeamUseCase, useValue: mockApprove },
      { provide: RejectTeamUseCase, useValue: mockReject },
    ],
  })
    .overrideGuard(JwtAuthGuard).useValue({
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = user
        return true
      },
    })
    .overrideGuard(TenantRolesGuard).useValue({ canActivate: () => true })
    .compile()
}

describe('RegistrationsController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod = await buildModule(ORGANIZER)
    app = mod.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('POST /registrations', () => {
    it('returns 201 with pending registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/registrations')
        .send({ championshipId: CHAMPIONSHIP_ID, teamId: TEAM_ID })

      expect(res.status).toBe(201)
      expect(res.body.status).toBe(RegistrationStatus.PENDENTE)
      expect(mockSubmit.execute).toHaveBeenCalledWith(
        expect.objectContaining({ championshipId: CHAMPIONSHIP_ID, teamId: TEAM_ID }),
        ORGANIZER.sub,
      )
    })

    it('returns 400 when championshipId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/registrations')
        .send({ teamId: TEAM_ID })

      expect(res.status).toBe(400)
    })

    it('returns 400 when teamId is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/registrations')
        .send({ championshipId: CHAMPIONSHIP_ID, teamId: 'not-uuid' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /registrations', () => {
    it('returns 200 with registration list for a championship', async () => {
      const res = await request(app.getHttpServer())
        .get('/registrations')
        .query({ championshipId: CHAMPIONSHIP_ID })

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(mockList.execute).toHaveBeenCalledWith(CHAMPIONSHIP_ID)
    })
  })

  describe('GET /registrations/:id', () => {
    it('returns 200 with registration detail', async () => {
      const res = await request(app.getHttpServer()).get(`/registrations/${REG_ID}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(REG_ID)
      expect(mockGet.execute).toHaveBeenCalledWith(REG_ID)
    })

    it('returns 400 when id is not a UUID', async () => {
      const res = await request(app.getHttpServer()).get('/registrations/bad-id')
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /registrations/:id/approve', () => {
    it('returns 200 with approved registration', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/registrations/${REG_ID}/approve`)
        .send({ reviewNote: 'Documentação completa' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(RegistrationStatus.APROVADO)
      expect(mockApprove.execute).toHaveBeenCalledWith(
        REG_ID,
        expect.objectContaining({ reviewNote: 'Documentação completa' }),
        ORGANIZER.sub,
      )
    })

    it('returns 200 with empty body (reviewNote is optional)', async () => {
      mockApprove.execute.mockClear()
      const res = await request(app.getHttpServer())
        .patch(`/registrations/${REG_ID}/approve`)
        .send({})

      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /registrations/:id/reject', () => {
    it('returns 200 with rejected registration', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/registrations/${REG_ID}/reject`)
        .send({ reviewNote: 'Documentação incompleta' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(RegistrationStatus.REJEITADO)
      expect(mockReject.execute).toHaveBeenCalledWith(
        REG_ID,
        expect.objectContaining({ reviewNote: 'Documentação incompleta' }),
        ORGANIZER.sub,
      )
    })
  })
})

describe('RegistrationsController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [RegistrationsController],
      providers: [
        { provide: SubmitRegistrationUseCase, useValue: mockSubmit },
        { provide: ListRegistrationsUseCase, useValue: mockList },
        { provide: GetRegistrationUseCase, useValue: mockGet },
        { provide: ApproveTeamUseCase, useValue: mockApprove },
        { provide: RejectTeamUseCase, useValue: mockReject },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = PLAYER
          return true
        },
      })
      .compile()

    app = mod.createNestApplication()
    await app.init()
  })

  afterAll(() => app.close())

  it('returns 403 when JOGADOR tries to list registrations', async () => {
    const res = await request(app.getHttpServer())
      .get('/registrations')
      .query({ championshipId: CHAMPIONSHIP_ID })

    expect(res.status).toBe(403)
  })

  it('returns 403 when JOGADOR tries to approve a registration', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/registrations/${REG_ID}/approve`)
      .send({})

    expect(res.status).toBe(403)
  })

  it('returns 403 when JOGADOR tries to reject a registration', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/registrations/${REG_ID}/reject`)
      .send({})

    expect(res.status).toBe(403)
  })

  it('returns 201 when JOGADOR submits a registration (no role restriction)', async () => {
    const res = await request(app.getHttpServer())
      .post('/registrations')
      .send({ championshipId: CHAMPIONSHIP_ID, teamId: TEAM_ID })

    expect(res.status).toBe(201)
  })
})
