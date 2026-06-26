import { describe, it, expect } from 'vitest'
import { SumulaEntity } from '../domain/entities/sumula.entity'
import { SumulaStatus } from '../domain/enums'

function makeSumula(status: SumulaStatus): SumulaEntity {
  return new SumulaEntity('s1', 'm1', 'c1', 'Estádio Municipal', null, status, null, null, null, new Date(), new Date())
}

describe('SumulaEntity', () => {
  it('isClosed() returns true when status is FECHADA', () => {
    expect(makeSumula(SumulaStatus.FECHADA).isClosed()).toBe(true)
  })

  it('isClosed() returns false when status is ABERTA', () => {
    expect(makeSumula(SumulaStatus.ABERTA).isClosed()).toBe(false)
  })
})
