import { describe, expect, it } from 'vitest'
import { Err, Ok, err, ok, type Result } from './result.type'

describe('Result type', () => {
  it('ok() wraps a value with ok=true', () => {
    const r = ok(42)
    expect(r).toBeInstanceOf(Ok)
    expect(r.ok).toBe(true)
    expect(r.value).toBe(42)
  })

  it('err() wraps an error with ok=false', () => {
    const e = new Error('falhou')
    const r = err(e)
    expect(r).toBeInstanceOf(Err)
    expect(r.ok).toBe(false)
    expect(r.error).toBe(e)
  })

  it('narrows via the ok discriminant', () => {
    const r: Result<number, Error> = Math.random() >= 0 ? ok(1) : err(new Error())
    if (r.ok) expect(r.value).toBe(1)
    else expect(r.error).toBeInstanceOf(Error)
  })
})
