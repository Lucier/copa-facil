import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { CryptService } from '../../../../infrastructure/crypt/crypt.service'
import { TenantContext } from '../../../../infrastructure/tenant/tenant-context'
import { TenantRegistryService } from '../../../../database/tenant-registry.service'
import {
  IAuditRepository} from '../../domain/repositories/i-audit.repository'
import {
  AUDIT_REPOSITORY
} from '../../domain/repositories/i-audit.repository'
import {
  IMembershipRepository} from '../../domain/repositories/i-membership.repository'
import {
  MEMBERSHIP_REPOSITORY,
} from '../../domain/repositories/i-membership.repository'
import {
  IOrganizationRepository} from '../../domain/repositories/i-organization.repository'
import {
  ORGANIZATION_REPOSITORY,
} from '../../domain/repositories/i-organization.repository'
import { IUserRepository} from '../../domain/repositories/i-user.repository'
import { USER_REPOSITORY } from '../../domain/repositories/i-user.repository'
import { UserRole } from '../../domain/roles.enum'
import { Email } from '../../domain/value-objects/email.vo'
import { Password } from '../../domain/value-objects/password.vo'
import { RegisterInputDto } from '../dtos/register-input.dto'
import { TokenOutputDto } from '../dtos/token-output.dto'
import { UserMapper } from '../mappers/user.mapper'
import { LoginUseCase } from './login.use-case'

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: IMembershipRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: IOrganizationRepository,
    @Inject(AUDIT_REPOSITORY) private readonly auditRepo: IAuditRepository,
    private readonly crypt: CryptService,
    private readonly tenantRegistry: TenantRegistryService,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(dto: RegisterInputDto): Promise<TokenOutputDto> {
    const email = Email.create(dto.email)
    const password = Password.createRaw(dto.password)

    const existing = await this.userRepo.findByEmail(email.getValue())
    if (existing) {
      throw new ConflictException('An account with this email already exists')
    }

    const passwordHash = await this.crypt.hash(password.raw)
    const user = await this.userRepo.create({
      name: dto.name,
      email: email.getValue(),
      passwordHash,
    })

    let schemaName: string | undefined
    let role: UserRole | undefined

    if (dto.organizationName && dto.organizationSlug) {
      const slug = dto.organizationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const slugTaken = await this.orgRepo.existsBySlug(slug)
      if (slugTaken) {
        throw new ConflictException('Organization slug is already in use')
      }

      schemaName = `tenant_${slug}`
      await this.orgRepo.create({ name: dto.organizationName, slug, schemaName })
      await this.tenantRegistry.provisionTenant(schemaName)

      role = UserRole.ORGANIZADOR
      await TenantContext.run(schemaName, async () => {
        await this.membershipRepo.create({ userId: user.id, role: UserRole.ORGANIZADOR })
      })
    }

    await this.auditRepo.log({
      userId: user.id,
      action: 'auth.register',
      metadata: { organizationCreated: !!schemaName },
    }).catch(() => void 0)

    const tokens = await this.loginUseCase.issueTokenPair(
      user.id,
      user.email,
      schemaName,
      role,
    )

    tokens.user = UserMapper.toDto(user)
    return tokens
  }
}
