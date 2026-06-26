import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { MatchesController } from '../presentation/controllers/matches.controller'
import { MatchEventsController } from '../presentation/controllers/match-events.controller'
import { StartMatchUseCase } from '../application/use-cases/start-match.use-case'
import { ConcludeMatchUseCase } from '../application/use-cases/conclude-match.use-case'
import { RegisterMatchEventUseCase } from '../application/use-cases/register-match-event.use-case'
import { GetMatchEventsUseCase } from '../application/use-cases/get-match-events.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../auth/presentation/guards/tenant-roles.guard'
import { MatchStatus } from '../../championships/domain/enums'
import { MatchEventType, GoalType } from '../domain/enums'

const MATCH_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

const LIVE_MATCH = { id: MATCH_ID, status: MatchStatus.LIVE, homeScore: 0, awayScore: 0 }
const FINISHED_MATCH = { id: MATCH_ID, status: MatchStatus.FINISHED, homeScore: 2, awayScore: 1 }
const GOAL_EVENT = { id: 'ev1', matchId: MATCH_ID, eventType: MatchEventType.GOL, minute: 30 }

const mockStart = { execute: vi.fn().mockResolvedValue(LIVE_MATCH) }
const mockConclude = { execute: vi.fn().mockResolvedValue(FINISHED_MATCH) }
const mockRegisterEvent = { execute: vi.fn().mockResolvedValue(GOAL_EVENT) }
const mockGetEvents = { execute: vi.fn().mockResolvedValue([GOAL_EVENT]) }

const ARBITRO = { sub: 'u1', email: 'arb@test.com', role: 'arbitro', jti: 'jti-1' }
const PLAYER = { sub: 'u2', email: 'jog@test.com', role: 'jogador', jti: 'jti-2' }

function makeApp(user: typeof ARBITRO) {
  return Test.createTestingModule({
    controllers: [MatchesController, MatchEventsController],
    providers: [
      { provide: StartMatchUseCase, useValue: mockStart },
      { provide: ConcludeMatchUseCase, useValue: mockConclude },
      { provide: RegisterMatchEventUseCase, useValue: mockRegisterEvent },
      { provide: GetMatchEventsUseCase, useValue: mockGetEvents },
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

describe('MatchesController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await makeApp(ARBITRO)
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('POST /matches/:id/start', () => {
    it('returns 200 with LIVE match', async () => {
      const res = await request(app.getHttpServer()).post(`/matches/${MATCH_ID}/start`)

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(MatchStatus.LIVE)
      expect(mockStart.execute).toHaveBeenCalledWith(MATCH_ID)
    })

    it('returns 400 when id is not a UUID', async () => {
      const res = await request(app.getHttpServer()).post('/matches/not-uuid/start')
      expect(res.status).toBe(400)
    })
  })

  describe('POST /matches/:id/conclude', () => {
    it('returns 200 with FINISHED match and final score', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/conclude`)
        .send({ homeScore: 2, awayScore: 1 })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(MatchStatus.FINISHED)
      expect(res.body.homeScore).toBe(2)
      expect(mockConclude.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ homeScore: 2, awayScore: 1 }),
      )
    })

    it('returns 400 when scores are missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/conclude`)
        .send({})

      expect(res.status).toBe(400)
    })

    it('returns 400 when score is negative', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/conclude`)
        .send({ homeScore: -1, awayScore: 0 })

      expect(res.status).toBe(400)
    })
  })
})

describe('MatchEventsController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await makeApp(ARBITRO)
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('POST /matches/:matchId/events', () => {
    it('returns 201 with created event', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/events`)
        .send({
          eventType: MatchEventType.GOL,
          teamId: 'e3db0a4e-3b77-4f88-9a12-1c02d3e4f5a6',
          minute: 30,
          goalType: GoalType.NORMAL,
        })

      expect(res.status).toBe(201)
      expect(res.body.eventType).toBe(MatchEventType.GOL)
      expect(mockRegisterEvent.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ eventType: MatchEventType.GOL, minute: 30 }),
      )
    })

    it('returns 400 when eventType is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/events`)
        .send({ eventType: 'INVALID', teamId: '33333333-3333-3333-3333-333333333333', minute: 10 })

      expect(res.status).toBe(400)
    })

    it('returns 400 when minute is above 120', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/events`)
        .send({
          eventType: MatchEventType.GOL,
          teamId: 'e3db0a4e-3b77-4f88-9a12-1c02d3e4f5a6',
          minute: 121,
          goalType: GoalType.NORMAL,
        })

      expect(res.status).toBe(400)
    })

    it('returns 400 when teamId is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/events`)
        .send({ eventType: MatchEventType.GOL, teamId: 'not-uuid', minute: 10, goalType: GoalType.NORMAL })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /matches/:matchId/events', () => {
    it('returns 200 with events list', async () => {
      const res = await request(app.getHttpServer()).get(`/matches/${MATCH_ID}/events`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(mockGetEvents.execute).toHaveBeenCalledWith(MATCH_ID)
    })
  })
})

describe('MatchesController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MatchesController, MatchEventsController],
      providers: [
        { provide: StartMatchUseCase, useValue: mockStart },
        { provide: ConcludeMatchUseCase, useValue: mockConclude },
        { provide: RegisterMatchEventUseCase, useValue: mockRegisterEvent },
        { provide: GetMatchEventsUseCase, useValue: mockGetEvents },
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
    await app.init()
  })

  afterAll(() => app.close())

  it('returns 403 when JOGADOR tries to start a match', async () => {
    const res = await request(app.getHttpServer()).post(`/matches/${MATCH_ID}/start`)
    expect(res.status).toBe(403)
  })

  it('returns 403 when JOGADOR tries to register an event', async () => {
    const res = await request(app.getHttpServer())
      .post(`/matches/${MATCH_ID}/events`)
      .send({ eventType: MatchEventType.GOL, teamId: 'e3db0a4e-3b77-4f88-9a12-1c02d3e4f5a6', minute: 10, goalType: GoalType.NORMAL })

    expect(res.status).toBe(403)
  })
})
