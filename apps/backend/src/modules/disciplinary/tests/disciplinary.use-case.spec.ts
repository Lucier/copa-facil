import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { CreateSuspensionUseCase } from '../application/use-cases/create-suspension.use-case'
import { CancelSuspensionUseCase } from '../application/use-cases/cancel-suspension.use-case'
import { ServeSuspensionUseCase } from '../application/use-cases/serve-suspension.use-case'
import { SUSPENSION_REPOSITORY } from '../domain/repositories/i-suspension.repository'
import { SuspensionStatus, SuspensionSource } from '../domain/enums'
import { NotFoundError } from '../../../shared/errors'

const ACTIVE_SUS = {
  id: 'sus-1',
  playerId: 'p1',
  teamId: 't1',
  championshipId: 'c1',
  status: SuspensionStatus.ATIVA,
  source: SuspensionSource.MANUAL,
  matchesToServe: 2,
  matchesServed: 0,
}

function buildRepo(override: Partial<typeof ACTIVE_SUS> = {}) {
  const data = { ...ACTIVE_SUS, ...override }
  return {
    create: vi.fn().mockResolvedValue(data),
    findById: vi.fn().mockResolvedValue(data),
    update: vi.fn().mockImplementation((_, patch) => Promise.resolve({ ...data, ...patch })),
  }
}

describe('CreateSuspensionUseCase', () => {
  it('creates manual suspension with correct source', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({
      providers: [CreateSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(CreateSuspensionUseCase).execute('c1', {
      playerId: 'p1',
      teamId: 't1',
      reason: 'Conduta antidesportiva',
      matchesToServe: 2,
    })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ source: SuspensionSource.MANUAL, championshipId: 'c1' }))
    expect(result.id).toBe('sus-1')
  })
})

describe('CancelSuspensionUseCase', () => {
  it('cancels an active suspension', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({
      providers: [CancelSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    const result = await mod.get(CancelSuspensionUseCase).execute('sus-1')
    expect(repo.update).toHaveBeenCalledWith('sus-1', expect.objectContaining({ status: SuspensionStatus.CANCELADA }))
    expect(result.status).toBe(SuspensionStatus.CANCELADA)
  })

  it('throws NotFoundError when suspension not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [CancelSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    await expect(mod.get(CancelSuspensionUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when suspension is already cancelled', async () => {
    const repo = buildRepo({ status: SuspensionStatus.CANCELADA })
    const mod = await Test.createTestingModule({
      providers: [CancelSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    const err = await mod.get(CancelSuspensionUseCase).execute('sus-1').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})

describe('ServeSuspensionUseCase', () => {
  it('increments matchesServed and keeps ATIVA when not yet complete', async () => {
    const repo = buildRepo({ matchesToServe: 2, matchesServed: 0 })
    const mod = await Test.createTestingModule({
      providers: [ServeSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    await mod.get(ServeSuspensionUseCase).execute('sus-1')
    expect(repo.update).toHaveBeenCalledWith('sus-1', expect.objectContaining({ matchesServed: 1, status: SuspensionStatus.ATIVA }))
  })

  it('marks as CUMPRIDA when matchesServed reaches matchesToServe', async () => {
    const repo = buildRepo({ matchesToServe: 1, matchesServed: 0 })
    const mod = await Test.createTestingModule({
      providers: [ServeSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    await mod.get(ServeSuspensionUseCase).execute('sus-1')
    expect(repo.update).toHaveBeenCalledWith('sus-1', expect.objectContaining({ status: SuspensionStatus.CUMPRIDA }))
  })

  it('throws NotFoundError when suspension not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({
      providers: [ServeSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    await expect(mod.get(ServeSuspensionUseCase).execute('unknown')).rejects.toThrow(NotFoundError)
  })

  it('throws INVALID_STATE when suspension is not active', async () => {
    const repo = buildRepo({ status: SuspensionStatus.CANCELADA })
    const mod = await Test.createTestingModule({
      providers: [ServeSuspensionUseCase, { provide: SUSPENSION_REPOSITORY, useValue: repo }],
    }).compile()
    const err = await mod.get(ServeSuspensionUseCase).execute('sus-1').catch((e) => e)
    expect((err as any).code).toBe('INVALID_STATE')
  })
})
