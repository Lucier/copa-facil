import { describe, it, expect, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { CreateJudgeUseCase } from '../application/use-cases/create-judge.use-case'
import { ListJudgesUseCase } from '../application/use-cases/list-judges.use-case'
import { GetJudgeUseCase } from '../application/use-cases/get-judge.use-case'
import { UpdateJudgeUseCase } from '../application/use-cases/update-judge.use-case'
import { DeleteJudgeUseCase } from '../application/use-cases/delete-judge.use-case'
import { JUDGE_REPOSITORY } from '../domain/repositories/i-judge.repository'
import { NotFoundError } from '../../../shared/errors'

const JUDGE = { id: 'j1', fullName: 'Árbitro Fulano', licenseNumber: 'CBF-001', role: 'arbitro_principal', isActive: true }

function buildRepo() {
  return {
    create: vi.fn().mockResolvedValue(JUDGE),
    findAll: vi.fn().mockResolvedValue([JUDGE]),
    findById: vi.fn().mockResolvedValue(JUDGE),
    update: vi.fn().mockResolvedValue({ ...JUDGE, fullName: 'Atualizado' }),
    delete: vi.fn().mockResolvedValue(undefined),
  }
}

describe('CreateJudgeUseCase', () => {
  it('creates judge', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [CreateJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(CreateJudgeUseCase).execute({ fullName: 'Árbitro Fulano', licenseNumber: 'CBF-001', role: 'arbitro_principal' as any, licenseCategory: 'federal' as any })
    expect(repo.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('j1')
  })
})

describe('ListJudgesUseCase', () => {
  it('returns all judges', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [ListJudgesUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(ListJudgesUseCase).execute()
    expect(result).toHaveLength(1)
  })
})

describe('GetJudgeUseCase', () => {
  it('returns judge by id', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [GetJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(GetJudgeUseCase).execute('j1')
    expect(result.id).toBe('j1')
  })

  it('throws NotFoundError when judge not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [GetJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(GetJudgeUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})

describe('UpdateJudgeUseCase', () => {
  it('updates judge', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [UpdateJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    const result = await mod.get(UpdateJudgeUseCase).execute('j1', { fullName: 'Atualizado' })
    expect(result.fullName).toBe('Atualizado')
  })

  it('throws NotFoundError when judge not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [UpdateJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(UpdateJudgeUseCase).execute('x', {})).rejects.toThrow(NotFoundError)
  })
})

describe('DeleteJudgeUseCase', () => {
  it('deletes judge', async () => {
    const repo = buildRepo()
    const mod = await Test.createTestingModule({ providers: [DeleteJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    await mod.get(DeleteJudgeUseCase).execute('j1')
    expect(repo.delete).toHaveBeenCalledWith('j1')
  })

  it('throws NotFoundError when judge not found', async () => {
    const repo = buildRepo()
    repo.findById.mockResolvedValue(null)
    const mod = await Test.createTestingModule({ providers: [DeleteJudgeUseCase, { provide: JUDGE_REPOSITORY, useValue: repo }] }).compile()
    await expect(mod.get(DeleteJudgeUseCase).execute('x')).rejects.toThrow(NotFoundError)
  })
})
