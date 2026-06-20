Act as a Staff Software Engineer and Backend Architect.

Your task is to bootstrap the entire initial boilerplate and folder structure for our backend using **NestJS** and **TypeScript**, strictly adhering to **Clean Architecture** patterns within a Modular Monolith.

The architecture must support our **Schema-per-Tenant** multi-tenancy strategy. Do NOT implement specific domain business rules yet. Focus exclusively on the infrastructure, plumbing, configurations, and core structural abstractions.

### Tech Stack Details:

- **Framework:** NestJS
- **Database:** PostgreSQL with Drizzle ORM (handling global/shared and dynamic tenant schemas)
- **Caching & Queues:** Redis & BullMQ
- **Documentation:** Swagger (OpenAPI)
- **Security:** JWT + Refresh Token strategy

### Target Folder Structure to Create:

Inside the root of the NestJS application (`src/`), you must create and scaffold the following directories and base files:

```text
src/
├── config/             # Global configurations (env validation, database, redis, jwt)
├── database/           # Drizzle connection management, pooling, dynamic tenant registry
├── shared/             # Domain primitives, value objects, base use-cases, types, and errors
├── infrastructure/     # Global infrastructure (http client, crypt, logging, storage proxies)
├── events/             # System-wide event publishers/subscribers (Event Emitter)
├── jobs/               # BullMQ global queues, processors, and definitions
├── websockets/         # Socket.io gateways for live score updates and notifications
└── modules/            # Domain-driven modules. Each module MUST use this structural split:
    └── [module_name]/
        ├── domain/          # Entities, aggregates, value objects, repository interfaces
        ├── application/     # Use cases, commands, queries, DTOs, mappers
        ├── infrastructure/  # Drizzle repositories, external service adapters
        └── presentation/    # NestJS Controllers, Resolvers, DTOs for HTTP/WS request/response
```
