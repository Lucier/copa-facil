Act as a Staff Software Engineer and API Platform Architect.

Your task is to fully implement the **Public API Module** inside our NestJS backend workspace. This module provides external developers, local news portals, and third-party integrators secure, read-only access to live championship data.

You must strictly adhere to **Clean Architecture** principles. This public layer must be heavily guarded against abuse using **Rate Limiting**, **API Key Authentication**, and structured **Audit Logging**. Most importantly, the API Key itself must dynamically resolve the tenant context (mapping the developer's token to their respective **Tenant Schema**) via our `TenantConnectionManager` before reaching the use cases.

### Core Endpoints to Implement (Read-Only Matrix):

Every endpoint must support advanced cursor-based or offset pagination, filtering (e.g., status, date, category), and nesting controls via query parameters:

1. `GET /api/v1/public/championships` - List active and finished tournaments hosted by the tenant.
2. `GET /api/v1/public/teams` - Directory of registered teams, including titles won and current rosters.
3. `GET /api/v1/public/players` - Searchable directory of athletes, filtering by position and age.
4. `GET /api/v1/public/matches` - Fixture lists, filterable by round, date, and live status (`Agendado`, `Em_Andamento`, `Encerrado`).
5. `GET /api/v1/public/standings` - Real-time league tables sorted mathematically by points, wins, and goal differences.
6. `GET /api/v1/public/statistics` - Dynamic leaderboards detailing Top Scorers, Assists, and Fair Play metrics.

### Security & Infrastructure Specifications:

- **API Key Guard (`ApiKeyGuard`):** Create a strategy that extracts a token from the `X-API-Key` header. It must validate the token against a shared-database central registry, determine which `organization_id` / `tenant_schema` it belongs to, and dynamically inject that schema context into the current execution context.
- **Redis Rate Limiting (`ThrottlerModule`):** Implement aggressive rate-limiting intervals backed by Redis (e.g., maximum 60 requests per minute per API Key). If a key exceeds limits, return an HTTP `429 Too Many Requests` with transparent rate-limit reset headers.
- **Public Audit Log Trail:** Every single request hitting the public endpoints must write an entry to the active tenant's `audit_logs` table tracking: API Key signature, request path, HTTP Method, Caller IP Address, Response Code, and Payload size.

### Directory Structure & Code Files to Generate:

Create the following architecture under a dedicated layer inside `src/modules/public-api/`:

```text
src/modules/public-api/
├── domain/
│   ├── entities/          # ApiKeyRegistry, PublicAuditEntry
│   └── repositories/      # IApiKeyRepository (Shared/Core lookup)
├── application/
│   ├── use-cases/         # ValidateApiKeyUseCase, LogPublicRequestUseCase
│   └── dtos/              # QueryFiltersDto, PaginatedResponseDto
├── infrastructure/
│   └── guards/            # ApiKeyGuard.ts (Resolves token -> Tenant search_path)
└── presentation/
    └── controllers/       # PublicChampionshipsController, PublicMatchesController, PublicStandingsController
```
