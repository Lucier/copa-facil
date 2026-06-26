import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { GetSumulaUseCase } from '../application/use-cases/get-sumula.use-case'
import { UpdateObservationsUseCase } from '../application/use-cases/update-observations.use-case'
import { AddOfficialUseCase } from '../application/use-cases/add-official.use-case'
import { RemovePlayerFromLineupUseCase } from '../application/use-cases/remove-player-from-lineup.use-case'
import { SUMULA_REPOSITORY } from '../domain/repositories/i-sumula.repository'
import { LINEUP_REPOSITORY } from '../domain/repositories/i-lineup.repository'
import { OFFICIAL_REPOSITORY } from '../domain/repositories/i-official.repository'
import { MATCH_EVENT_REPOSITORY } from '../../match-engine/domain/repositories/i-match-event.repository'
import { SumulaEntity } from '../domain/entities/sumula.entity'
import { SumulaStatus } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const OPEN_SUMULA = new SumulaEntity('s1', 'm1', 'c1', null, null, SumulaStatus.ABERTA, null, null, null, new Date(), new Date())
const CLOSED_SUMULA = new SumulaEntity('s1', 'm1', 'c1', null, null, SumulaStatus.FECHADA, new Date(), 'uid', 'hash', new Date(), new Date())

describe('GetSumulaUseCase', () => {
  it('returns full sumula view when sumula exists', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(OPEN_SUMULA) }
    const lineupRepo = { findByMatchId: vi.fn().mockResolvedValue([]) }
    const officialRepo = { findByMatchId: vi.fn().mockResolvedValue([]) }
    const eventRepo = { findByMatchId: vi.fn().mockResolvedValue([]) }

    const mod = await Test.createTestingModule({
      providers: [
        GetSumulaUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: lineupRepo },
        { provide: OFFICIAL_REPOSITORY, useValue: officialRepo },
        { provide: MATCH_EVENT_REPOSITORY, useValue: eventRepo },
      ],
    }).compile()

    const result = await mod.get(GetSumulaUseCase).execute('m1')
    expect(result.sumula.id).toBe('s1')
    expect(result.lineup).toEqual([])
    expect(result.officials).toEqual([])
    expect(result.events).toEqual([])
  })

  it('throws NotFoundError when sumula does not exist', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(null) }
    const mod = await Test.createTestingModule({
      providers: [
        GetSumulaUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: { findByMatchId: vi.fn() } },
        { provide: OFFICIAL_REPOSITORY, useValue: { findByMatchId: vi.fn() } },
        { provide: MATCH_EVENT_REPOSITORY, useValue: { findByMatchId: vi.fn() } },
      ],
    }).compile()
    await expect(mod.get(GetSumulaUseCase).execute('m1')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdateObservationsUseCase', () => {
  it('updates observations when sumula is open', async () => {
    const UPDATED = new SumulaEntity('s1', 'm1', 'c1', null, 'novas observações', SumulaStatus.ABERTA, null, null, null, new Date(), new Date())
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(OPEN_SUMULA), update: vi.fn().mockResolvedValue(UPDATED) }
    const mod = await Test.createTestingModule({
      providers: [UpdateObservationsUseCase, { provide: SUMULA_REPOSITORY, useValue: sumulaRepo }],
    }).compile()
    const result = await mod.get(UpdateObservationsUseCase).execute('m1', { observations: 'novas observações' })
    expect(sumulaRepo.update).toHaveBeenCalledWith('s1', { observations: 'novas observações' })
    expect(result.observations).toBe('novas observações')
  })

  it('throws NotFoundError when sumula does not exist', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(null), update: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [UpdateObservationsUseCase, { provide: SUMULA_REPOSITORY, useValue: sumulaRepo }],
    }).compile()
    await expect(mod.get(UpdateObservationsUseCase).execute('m1', { observations: 'x' })).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when sumula is closed', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(CLOSED_SUMULA), update: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [UpdateObservationsUseCase, { provide: SUMULA_REPOSITORY, useValue: sumulaRepo }],
    }).compile()
    const err = await mod.get(UpdateObservationsUseCase).execute('m1', { observations: 'x' }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})

describe('AddOfficialUseCase', () => {
  const OFFICIAL = { id: 'o1', matchId: 'm1', name: 'Árbitro Teste', role: 'arbitro_principal' }

  it('adds official to open sumula', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(OPEN_SUMULA) }
    const officialRepo = { create: vi.fn().mockResolvedValue(OFFICIAL) }
    const mod = await Test.createTestingModule({
      providers: [
        AddOfficialUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: OFFICIAL_REPOSITORY, useValue: officialRepo },
      ],
    }).compile()
    const result = await mod.get(AddOfficialUseCase).execute('m1', { name: 'Árbitro Teste', role: 'arbitro_principal' as any })
    expect(result.id).toBe('o1')
    expect(officialRepo.create).toHaveBeenCalledWith(expect.objectContaining({ matchId: 'm1', name: 'Árbitro Teste' }))
  })

  it('throws INVALID_STATE when sumula is closed', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(CLOSED_SUMULA) }
    const officialRepo = { create: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [
        AddOfficialUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: OFFICIAL_REPOSITORY, useValue: officialRepo },
      ],
    }).compile()
    const err = await mod.get(AddOfficialUseCase).execute('m1', { name: 'x', role: 'arbitro_principal' as any }).catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})

describe('RemovePlayerFromLineupUseCase', () => {
  const LINEUP = { id: 'l1', matchId: 'm1', playerId: 'p1' }

  it('removes player from lineup when sumula is open', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(OPEN_SUMULA) }
    const lineupRepo = { findById: vi.fn().mockResolvedValue(LINEUP), delete: vi.fn().mockResolvedValue(undefined) }
    const mod = await Test.createTestingModule({
      providers: [
        RemovePlayerFromLineupUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: lineupRepo },
      ],
    }).compile()
    await mod.get(RemovePlayerFromLineupUseCase).execute('m1', 'l1')
    expect(lineupRepo.delete).toHaveBeenCalledWith('l1')
  })

  it('throws INVALID_STATE when sumula is closed', async () => {
    const sumulaRepo = { findByMatchId: vi.fn().mockResolvedValue(CLOSED_SUMULA) }
    const lineupRepo = { findById: vi.fn().mockResolvedValue(LINEUP), delete: vi.fn() }
    const mod = await Test.createTestingModule({
      providers: [
        RemovePlayerFromLineupUseCase,
        { provide: SUMULA_REPOSITORY, useValue: sumulaRepo },
        { provide: LINEUP_REPOSITORY, useValue: lineupRepo },
      ],
    }).compile()
    const err = await mod.get(RemovePlayerFromLineupUseCase).execute('m1', 'l1').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
