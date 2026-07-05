import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { TeamsController } from '../presentation/controllers/teams.controller'
import { CreateTeamUseCase } from '../application/use-cases/create-team.use-case'
import { ListTeamsUseCase } from '../application/use-cases/list-teams.use-case'
import { GetTeamUseCase } from '../application/use-cases/get-team.use-case'
import { UpdateTeamUseCase } from '../application/use-cases/update-team.use-case'
import { DeleteTeamUseCase } from '../application/use-cases/delete-team.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'

const TEAM_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

const mocks = {
  create: { execute: vi.fn().mockResolvedValue({ id: TEAM_ID, name: 'Time A' }) },
  list: { execute: vi.fn().mockResolvedValue([{ id: TEAM_ID }]) },
  get: { execute: vi.fn().mockResolvedValue({ id: TEAM_ID, name: 'Time A' }) },
  update: { execute: vi.fn().mockResolvedValue({ id: TEAM_ID, name: 'Time B' }) },
  delete: { execute: vi.fn().mockResolvedValue(undefined) },
}

const ORGANIZER = { sub: 'org-1', email: 'org@test.com', role: 'organizador', jti: 'jti-1' }
const TORCEDOR = { sub: 'tor-1', email: 'tor@test.com', role: 'torcedor', jti: 'jti-2' }

async function buildApp(user: typeof ORGANIZER): Promise<INestApplication> {
  const mod = await Test.createTestingModule({
    controllers: [TeamsController],
    providers: [
      { provide: CreateTeamUseCase, useValue: mocks.create },
      { provide: ListTeamsUseCase, useValue: mocks.list },
      { provide: GetTeamUseCase, useValue: mocks.get },
      { provide: UpdateTeamUseCase, useValue: mocks.update },
      { provide: DeleteTeamUseCase, useValue: mocks.delete },
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

describe('TeamsController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(ORGANIZER)
  })

  afterAll(() => app.close())

  it('POST /teams creates a team', async () => {
    const res = await request(app.getHttpServer()).post('/teams').send({
      name: 'Time A',
      acronym: 'TA',
      primaryColor: '#FF0000',
    })
    expect(res.status).toBe(201)
    expect(mocks.create.execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Time A', primaryColor: '#FF0000' }),
    )
  })

  it('POST /teams rejects missing name and invalid hex color', async () => {
    const bad1 = await request(app.getHttpServer()).post('/teams').send({ acronym: 'TA' })
    const bad2 = await request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'Time A', primaryColor: 'vermelho' })
    expect(bad1.status).toBe(400)
    expect(bad2.status).toBe(400)
  })

  it('POST /teams rejects unknown extra fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'Time A', hacked: true })
    expect(res.status).toBe(400)
  })

  it('GET /teams lists teams', async () => {
    const res = await request(app.getHttpServer()).get('/teams')
    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe(TEAM_ID)
  })

  it('GET /teams/:id returns a team', async () => {
    const res = await request(app.getHttpServer()).get(`/teams/${TEAM_ID}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Time A')
  })

  it('GET /teams/:id rejects non-UUID id', async () => {
    const res = await request(app.getHttpServer()).get('/teams/abc')
    expect(res.status).toBe(400)
  })

  it('PATCH /teams/:id updates a team', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/teams/${TEAM_ID}`)
      .send({ name: 'Time B' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Time B')
  })

  it('DELETE /teams/:id returns 204', async () => {
    const res = await request(app.getHttpServer()).delete(`/teams/${TEAM_ID}`)
    expect(res.status).toBe(204)
    expect(mocks.delete.execute).toHaveBeenCalledWith(TEAM_ID)
  })
})

describe('TeamsController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await buildApp(TORCEDOR)
  })

  afterAll(() => app.close())

  it('write routes return 403 for torcedor', async () => {
    const create = await request(app.getHttpServer()).post('/teams').send({ name: 'X' })
    const update = await request(app.getHttpServer())
      .patch(`/teams/${TEAM_ID}`)
      .send({ name: 'Y' })
    const del = await request(app.getHttpServer()).delete(`/teams/${TEAM_ID}`)
    expect(create.status).toBe(403)
    expect(update.status).toBe(403)
    expect(del.status).toBe(403)
  })

  it('read routes are allowed for torcedor', async () => {
    const list = await request(app.getHttpServer()).get('/teams')
    const one = await request(app.getHttpServer()).get(`/teams/${TEAM_ID}`)
    expect(list.status).toBe(200)
    expect(one.status).toBe(200)
  })
})
