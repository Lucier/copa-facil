import { Migration } from '../types'
import { migration as m0000 } from './0000_initial'
import { migration as m0001 } from './0001_performance_indexes'

export const tenantMigrations: Migration[] = [m0000, m0001]
