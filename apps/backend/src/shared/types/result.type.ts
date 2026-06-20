export type Result<T, E = Error> = Ok<T> | Err<E>

export class Ok<T> {
  readonly ok = true as const
  constructor(public readonly value: T) {}
}

export class Err<E> {
  readonly ok = false as const
  constructor(public readonly error: E) {}
}

export const ok = <T>(value: T): Ok<T> => new Ok(value)
export const err = <E>(error: E): Err<E> => new Err(error)
