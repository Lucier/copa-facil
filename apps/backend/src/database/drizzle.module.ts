import { Module } from '@nestjs/common'
import { DrizzleService } from './drizzle.service'
import { MigrationRunnerService } from './migration-runner.service'
import { TenantRegistryService } from './tenant-registry.service'

@Module({
  providers: [DrizzleService, MigrationRunnerService, TenantRegistryService],
  exports: [DrizzleService, TenantRegistryService, MigrationRunnerService],
})
export class DrizzleModule {}
