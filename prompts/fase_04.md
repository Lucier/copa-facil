Act as a Staff Software Engineer and Cyber Security Architect.

Your task is to fully implement the **Auth Module** inside our NestJS backend workspace, following **Clean Architecture** principles and strictly respecting our **Schema-per-Tenant** isolation strategy.

### Multi-Tenancy Architecture Constraints (Schema-per-Tenant):

- **Global Context (`public` / `core` schema):** The initial authentication, user registration (`users` table), and master tenant routing (`organizations` table) must happen at the global level. A user profile exists globally so they can log into the platform.
- **Tenant Context (Dynamic Schema):** Once authenticated, a user's specific roles, permissions, memberships (`memberships`, `roles`, `permissions`), and specific activity logs (`audit_logs`) live inside the isolated PostgreSQL schema of the tenant they are accessing.
- **Dynamic Switch:** Your code must use our `TenantConnectionManager` to resolve the correct tenant database context at runtime using `SET search_path` or schema-bound factories.

### Core Features to Implement:

1. **Login:** Validate global credentials, cross-reference tenant memberships, and issue a signed JWT.
2. **Cadastro (Tenant Setup / Self-Registration):** Dual-write capability. Create a user globally and, if creating an organization, automatically provision their new dedicated PostgreSQL schema. If joining an existing tenant, create the membership row inside that tenant's schema.
3. **Logout:** Invalidate/revoke tokens (using Redis blocklist/store).
4. **Refresh Token:** Exchange a valid, non-expired refresh token for a new access/refresh token pair.
5. **Recuperação de Senha:** Generate secure tokens for password resets (stored in Redis with short TTL).

### Role-Based Access Control (RBAC):

Implement a strict RBAC engine recognizing the following hierarchy/scopes:

- `Super Admin` (Global / Platform control)
- `Organizador` (Full admin rights inside their specific Tenant Schema)
- `Árbitro` (Match execution scopes inside Tenant)
- `Comissão Técnica` (Team/Staff controls inside Tenant)
- `Jogador` (Player profile/registration actions inside Tenant)
- `Torcedor` (Read-only/Public interaction scopes inside Tenant)

### Directory Structure & Code Files to Generate:

Create the following files under `src/modules/auth/` splitting them into Clean Architecture layers:

```text
src/modules/auth/
├── domain/
│   ├── entities/          # User (Global/Shared Reference), Member, Token, AuditLog
│   ├── value-objects/     # Email, Password (with hashing logic/bcrypt abstraction)
│   └── repositories/      # IUserRepository (Global), IMembershipRepository (Tenant), IAuditRepository (Tenant)
├── application/
│   ├── use-cases/         # LoginUseCase, RegisterUseCase, RefreshTokenUseCase, ResetPasswordUseCase, LogoutUseCase
│   ├── dtos/              # LoginInputDto, RegisterInputDto, TokenOutputDto, etc.
│   └── mappers/           # UserMapper, TenantMemberMapper
├── infrastructure/
│   ├── repositories/      # DrizzleUserRepository (Shared), DrizzleMembershipRepository (Tenant-scoped via Connection Manager)
│   ├── strategies/        # JwtStrategy, RefreshTokenStrategy
│   └── services/          # BcryptService, RedisTokenStoreService
└── presentation/
    ├── controllers/       # AuthController (HTTP endpoints: login, register, refresh, logout)
    └── guards/            # TenantRolesGuard (RBAC execution validator utilizing tenant context metadata)
```
