import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication} from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { ChampionshipController } from '../presentation/controllers/championship.controller'
import { CreateChampionshipUseCase } from '../application/use-cases/create-championship.use-case'
import { GenerateFixturesUseCase } from '../application/use-cases/generate-fixtures.use-case'
import { GetBracketTreeUseCase } from '../application/use-cases/get-bracket-tree.use-case'
import { ListChampionshipsUseCase } from '../application/use-cases/list-championships.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../auth/presentation/guards/tenant-roles.guard'
import { TournamentFormat } from '../domain/enums'

const ORGANIZER = { sub: 'u1', email: 'org@test.com', role: 'organizador', jti: 'jti-1' }
const PLAYER = { sub: 'u2', email: 'jogador@test.com', role: 'jogador', jti: 'jti-2' }

const CHAMPIONSHIP = {
  id: 'c1',
  name: 'Copa Test',
  season: '2025',
  format: TournamentFormat.PONTOS_CORRIDOS,
  legs: 1,
}

const BRACKET = { rounds: [], standings: [] }

const mockCreate = { execute: vi.fn().mockResolvedValue(CHAMPIONSHIP) }
const mockFixtures = { execute: vi.fn().mockResolvedValue(BRACKET) }
const mockBracket = { execute: vi.fn().mockResolvedValue(BRACKET) }
const mockList = { execute: vi.fn().mockResolvedValue([CHAMPIONSHIP]) }

function buildApp(user: typeof ORGANIZER) {
  return Test.createTestingModule({
    controllers: [ChampionshipController],
    providers: [
      { provide: CreateChampionshipUseCase, useValue: mockCreate },
      { provide: GenerateFixturesUseCase, useValue: mockFixtures },
      { provide: GetBracketTreeUseCase, useValue: mockBracket },
      { provide: ListChampionshipsUseCase, useValue: mockList },
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

describe('ChampionshipController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await buildApp(ORGANIZER)
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('GET /championships', () => {
    it('returns 200 with championship list', async () => {
      const res = await request(app.getHttpServer()).get('/championships')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].id).toBe('c1')
      expect(mockList.execute).toHaveBeenCalled()
    })
  })

  describe('POST /championships', () => {
    it('returns 201 when DTO is valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships')
        .send({ name: 'Copa Test', season: '2025', format: TournamentFormat.PONTOS_CORRIDOS })

      expect(res.status).toBe(201)
      expect(res.body.id).toBe('c1')
      expect(mockCreate.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Copa Test', format: TournamentFormat.PONTOS_CORRIDOS }),
      )
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships')
        .send({ season: '2025', format: TournamentFormat.PONTOS_CORRIDOS })

      expect(res.status).toBe(400)
    })

    it('returns 400 when format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships')
        .send({ name: 'Copa', season: '2025', format: 'formato_invalido' })

      expect(res.status).toBe(400)
    })

    it('returns 400 when legs is out of range', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships')
        .send({ name: 'Copa', season: '2025', format: TournamentFormat.PONTOS_CORRIDOS, legs: 3 })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /championships/:id/generate-fixtures', () => {
    it('returns 200 with bracket structure', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/generate-fixtures')
        .send({ teamIds: ['e3db0a4e-3b77-4f88-9a12-1c02d3e4f5a6', 'd4ec1b0e-4c88-4f99-9b23-2d03e4f5a6b7'] })

      expect(res.status).toBe(200)
      expect(mockFixtures.execute).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        expect.anything(),
      )
    })

    it('returns 400 when id is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/championships/not-a-uuid/generate-fixtures')
        .send({})

      expect(res.status).toBe(400)
    })
  })

  describe('GET /championships/:id/bracket', () => {
    it('returns 200 with bracket tree', async () => {
      const res = await request(app.getHttpServer())
        .get('/championships/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/bracket')

      expect(res.status).toBe(200)
      expect(mockBracket.execute).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    })

    it('returns 400 when id is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/championships/bad-id/bracket')

      expect(res.status).toBe(400)
    })
  })
})

describe('ChampionshipController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChampionshipController],
      providers: [
        { provide: CreateChampionshipUseCase, useValue: mockCreate },
        { provide: GenerateFixturesUseCase, useValue: mockFixtures },
        { provide: GetBracketTreeUseCase, useValue: mockBracket },
        { provide: ListChampionshipsUseCase, useValue: mockList },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = PLAYER
          return true
        },
      })
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterAll(() => app.close())

  it('returns 403 when JOGADOR tries to create a championship', async () => {
    const res = await request(app.getHttpServer())
      .post('/championships')
      .send({ name: 'Copa', season: '2025', format: TournamentFormat.PONTOS_CORRIDOS })

    expect(res.status).toBe(403)
  })
})
