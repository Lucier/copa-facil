import { Migration } from '../types'
import { migration as m0000 } from './0000_initial'

export const tenantMigrations: Migration[] = [m0000]
