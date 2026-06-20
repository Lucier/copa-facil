import { Module } from '@nestjs/common'
import { CoreSchemaService } from './core-schema.service'
import { DrizzleService } from './drizzle.service'
import { TenantRegistryService } from './tenant-registry.service'

@Module({
  providers: [DrizzleService, TenantRegistryService, CoreSchemaService],
  exports: [DrizzleService, TenantRegistryService],
})
export class DrizzleModule {}
