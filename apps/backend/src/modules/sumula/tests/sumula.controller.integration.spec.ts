import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { SumulaController } from '../presentation/controllers/sumula.controller'
import { OpenSumulaUseCase } from '../application/use-cases/open-sumula.use-case'
import { GetSumulaUseCase } from '../application/use-cases/get-sumula.use-case'
import { AddPlayerToLineupUseCase } from '../application/use-cases/add-player-to-lineup.use-case'
import { RemovePlayerFromLineupUseCase } from '../application/use-cases/remove-player-from-lineup.use-case'
import { AddOfficialUseCase } from '../application/use-cases/add-official.use-case'
import { RemoveOfficialUseCase } from '../application/use-cases/remove-official.use-case'
import { UpdateObservationsUseCase } from '../application/use-cases/update-observations.use-case'
import { CloseSumulaUseCase } from '../application/use-cases/close-sumula.use-case'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../auth/presentation/guards/tenant-roles.guard'
import { OfficialRole, SumulaStatus } from '../domain/enums'

const MATCH_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const TEAM_ID = 'e3db0a4e-3b77-4f88-9a12-1c02d3e4f5a6'
const PLAYER_ID = 'd2ca1b3d-2a66-4e77-8b01-0b01c2d3e4b5'
const LINEUP_ID = 'c1b90a2c-1955-4d66-7900-0a01b2c3d4a4'
const OFFICIAL_ID = 'b0a80b1b-0844-4c55-6890-9901a2b3c493'

const OPEN_SUMULA = { id: 's1', matchId: MATCH_ID, status: SumulaStatus.ABERTA }
const CLOSED_SUMULA = { id: 's1', matchId: MATCH_ID, status: SumulaStatus.FECHADA, integrityHash: 'abc123' }
const SUMULA_VIEW = { ...OPEN_SUMULA, lineup: [], officials: [] }
const LINEUP_ENTRY = { id: LINEUP_ID, matchId: MATCH_ID, playerId: PLAYER_ID, teamId: TEAM_ID }
const OFFICIAL_ENTRY = { id: OFFICIAL_ID, matchId: MATCH_ID }

const mockOpen = { execute: vi.fn().mockResolvedValue(OPEN_SUMULA) }
const mockGet = { execute: vi.fn().mockResolvedValue(SUMULA_VIEW) }
const mockAddLineup = { execute: vi.fn().mockResolvedValue(LINEUP_ENTRY) }
const mockRemoveLineup = { execute: vi.fn().mockResolvedValue(undefined) }
const mockAddOfficial = { execute: vi.fn().mockResolvedValue(OFFICIAL_ENTRY) }
const mockRemoveOfficial = { execute: vi.fn().mockResolvedValue(undefined) }
const mockUpdateObs = { execute: vi.fn().mockResolvedValue(OPEN_SUMULA) }
const mockClose = { execute: vi.fn().mockResolvedValue(CLOSED_SUMULA) }

const ARBITRO = { sub: 'arb-1', email: 'arb@test.com', role: 'arbitro', jti: 'jti-1' }
const PLAYER = { sub: 'jog-1', email: 'jog@test.com', role: 'jogador', jti: 'jti-2' }

function buildModule(user: typeof ARBITRO) {
  return Test.createTestingModule({
    controllers: [SumulaController],
    providers: [
      { provide: OpenSumulaUseCase, useValue: mockOpen },
      { provide: GetSumulaUseCase, useValue: mockGet },
      { provide: AddPlayerToLineupUseCase, useValue: mockAddLineup },
      { provide: RemovePlayerFromLineupUseCase, useValue: mockRemoveLineup },
      { provide: AddOfficialUseCase, useValue: mockAddOfficial },
      { provide: RemoveOfficialUseCase, useValue: mockRemoveOfficial },
      { provide: UpdateObservationsUseCase, useValue: mockUpdateObs },
      { provide: CloseSumulaUseCase, useValue: mockClose },
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

describe('SumulaController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod = await buildModule(ARBITRO)
    app = mod.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(() => app.close())

  describe('POST /matches/:matchId/sumula', () => {
    it('returns 201 with opened sumula', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula`)
        .send({ venue: 'Estádio Municipal' })

      expect(res.status).toBe(201)
      expect(res.body.status).toBe(SumulaStatus.ABERTA)
      expect(mockOpen.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ venue: 'Estádio Municipal' }),
      )
    })

    it('returns 201 with empty body (venue is optional)', async () => {
      mockOpen.execute.mockClear()
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula`)
        .send({})

      expect(res.status).toBe(201)
    })

    it('returns 400 when matchId is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/matches/not-uuid/sumula')
        .send({})

      expect(res.status).toBe(400)
    })
  })

  describe('GET /matches/:matchId/sumula', () => {
    it('returns 200 with full sumula view', async () => {
      const res = await request(app.getHttpServer()).get(`/matches/${MATCH_ID}/sumula`)

      expect(res.status).toBe(200)
      expect(res.body.lineup).toBeInstanceOf(Array)
      expect(mockGet.execute).toHaveBeenCalledWith(MATCH_ID)
    })
  })

  describe('POST /matches/:matchId/sumula/lineup', () => {
    it('returns 201 with lineup entry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula/lineup`)
        .send({ teamId: TEAM_ID, playerId: PLAYER_ID, jerseyNumber: 9, isStarter: true })

      expect(res.status).toBe(201)
      expect(res.body.playerId).toBe(PLAYER_ID)
      expect(mockAddLineup.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ playerId: PLAYER_ID, jerseyNumber: 9 }),
      )
    })

    it('returns 400 when teamId is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula/lineup`)
        .send({ teamId: 'bad', playerId: PLAYER_ID })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /matches/:matchId/sumula/lineup/:lineupId', () => {
    it('returns 204 when removing a player from lineup', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/matches/${MATCH_ID}/sumula/lineup/${LINEUP_ID}`)

      expect(res.status).toBe(204)
      expect(mockRemoveLineup.execute).toHaveBeenCalledWith(MATCH_ID, LINEUP_ID)
    })
  })

  describe('POST /matches/:matchId/sumula/officials', () => {
    it('returns 201 with official entry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula/officials`)
        .send({ name: 'João Árbitro', role: OfficialRole.ARBITRO_PRINCIPAL })

      expect(res.status).toBe(201)
      expect(mockAddOfficial.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ name: 'João Árbitro' }),
      )
    })
  })

  describe('PATCH /matches/:matchId/sumula/observations', () => {
    it('returns 200 with updated sumula', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/matches/${MATCH_ID}/sumula/observations`)
        .send({ observations: 'Partida disputada sem incidentes.' })

      expect(res.status).toBe(200)
      expect(mockUpdateObs.execute).toHaveBeenCalledWith(
        MATCH_ID,
        expect.objectContaining({ observations: 'Partida disputada sem incidentes.' }),
      )
    })
  })

  describe('DELETE /matches/:matchId/sumula/officials/:officialId', () => {
    it('returns 204 when removing an official', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/matches/${MATCH_ID}/sumula/officials/${OFFICIAL_ID}`)

      expect(res.status).toBe(204)
      expect(mockRemoveOfficial.execute).toHaveBeenCalledWith(MATCH_ID, OFFICIAL_ID)
    })
  })

  describe('POST /matches/:matchId/sumula/close', () => {
    it('returns 200 with FECHADA sumula and integrity hash', async () => {
      const res = await request(app.getHttpServer())
        .post(`/matches/${MATCH_ID}/sumula/close`)

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(SumulaStatus.FECHADA)
      expect(res.body.integrityHash).toBeDefined()
      expect(mockClose.execute).toHaveBeenCalledWith(MATCH_ID, ARBITRO.sub)
    })
  })
})

describe('SumulaController – RBAC (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [SumulaController],
      providers: [
        { provide: OpenSumulaUseCase, useValue: mockOpen },
        { provide: GetSumulaUseCase, useValue: mockGet },
        { provide: AddPlayerToLineupUseCase, useValue: mockAddLineup },
        { provide: RemovePlayerFromLineupUseCase, useValue: mockRemoveLineup },
        { provide: AddOfficialUseCase, useValue: mockAddOfficial },
        { provide: RemoveOfficialUseCase, useValue: mockRemoveOfficial },
        { provide: UpdateObservationsUseCase, useValue: mockUpdateObs },
        { provide: CloseSumulaUseCase, useValue: mockClose },
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

  it('returns 403 when JOGADOR tries to open a sumula', async () => {
    const res = await request(app.getHttpServer())
      .post(`/matches/${MATCH_ID}/sumula`)
      .send({})
    expect(res.status).toBe(403)
  })

  it('returns 403 when JOGADOR tries to close a sumula', async () => {
    const res = await request(app.getHttpServer())
      .post(`/matches/${MATCH_ID}/sumula/close`)
    expect(res.status).toBe(403)
  })

  it('returns 200 when JOGADOR reads the sumula (no role restriction)', async () => {
    const res = await request(app.getHttpServer()).get(`/matches/${MATCH_ID}/sumula`)
    expect(res.status).toBe(200)
  })
})
