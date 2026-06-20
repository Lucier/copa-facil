import { AsyncLocalStorage } from 'async_hooks'

interface TenantStore {
  schema: string
}

const storage = new AsyncLocalStorage<TenantStore>()

export const TenantContext = {
  run<T>(schema: string, fn: () => T): T {
    return storage.run({ schema }, fn)
  },

  getSchema(): string {
    return storage.getStore()?.schema ?? 'public'
  },

  hasContext(): boolean {
    return storage.getStore() !== undefined
  },
}
