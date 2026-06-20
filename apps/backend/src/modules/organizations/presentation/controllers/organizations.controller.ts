import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { TenantRolesGuard } from '../../../auth/presentation/guards/tenant-roles.guard'
import { Roles } from '../../../auth/presentation/decorators/roles.decorator'
import { UserRole } from '../../../auth/domain/roles.enum'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import { UpdateOrganizationDto } from '../../application/dtos/update-organization.dto'
import { GetOrganizationUseCase } from '../../application/use-cases/get-organization.use-case'
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization.use-case'

@ApiTags('Organizations')
@ApiSecurity('x-tenant-id')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantRolesGuard)
@Controller('organizations/me')
export class OrganizationsController {
  constructor(
    private readonly getOrg: GetOrganizationUseCase,
    private readonly updateOrg: UpdateOrganizationUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current organization info' })
  get(): Promise<OrganizationEntity> {
    return this.getOrg.execute()
  }

  @Patch()
  @Roles(UserRole.ORGANIZADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update organization name' })
  update(@Body() dto: UpdateOrganizationDto): Promise<OrganizationEntity> {
    return this.updateOrg.execute(dto)
  }
}
