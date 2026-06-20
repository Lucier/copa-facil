Act as a Staff Software Architect.

We are starting a new project from scratch: a Multi-Tenant SaaS platform for sports championship management (inspired by platforms like Copa Fácil).

Your task is to bootstrap the architectural documentation of this project. Do NOT write any application code (NestJS, Next.js, etc.) yet. Instead, create a comprehensive documentation structure inside a new directory named `docs/architecture/`.

### Tech Stack & Multi-Tenancy Strategy Context

- **Architecture:** Modular Monolith prepared for Microservices.
- **Backend:** NestJS.
- **Frontend:** Next.js (App Router).
- **Mobile:** React Native (Expo).
- **Database:** PostgreSQL utilizing a strict **Schema-based Multi-Tenancy architecture** (one isolated PostgreSQL Schema per Organization/Tenant, plus a shared `public` or `core` schema for global platform data like users, global configurations, and tenant routing).
- **ORM Target:** Drizzle ORM (handling dynamic runtime schema selection or dynamic connections based on tenant context).
- **Caching/PubSub:** Redis (isolated per tenant via key prefixing/namespacing aligned with the schema names).
- **Object Storage:** MinIO.

### Core Modules to Account For

Auth, Organizations, Championships, Teams, Players, Staff, Matches, Statistics, Standings, Registrations, Payments, CMS, Notifications, Public API.

### Deliverables

Create the following Markdown files inside `docs/architecture/`. Ensure they are production-grade, highly detailed, and deeply technical:

1. `01-architecture-overview.md`: High-level architectural document detailing the Modular Monolith strategy and boundaries. Include a Mermaid diagram representing the architecture layer.
2. `02-ddd-strategic-design.md`: Context Map (DDD), Bounded Contexts definition, and a textual Event Storming session for the core match/registration flows.
3. `03-multi-tenancy-strategy.md`: Deep dive into the **Schema-per-Tenant isolation strategy**. Explain the architecture of the shared/global schema vs. tenant schemas, connection pooling management, runtime schema switching (`search_path` routing or dynamic Drizzle configuration), and Redis namespacing.
4. `04-use-cases-and-flows.md`: Core business flows and use cases for at least: Registration/Payment, Tournament Bracket Generation, and Live Match Score Updating.
5. `05-adr-001-architecture-pattern.md`: Architectural Decision Record (ADR) justifying the Modular Monolith over early Microservices.
6. `06-adr-002-multi-tenancy.md`: ADR justifying the choice of **Schema-per-Tenant isolation** over Shared-Database (Row-Level Security) and Database-per-Tenant, highlighting its pros, cons, compliance benefits, scaling limits, and resource optimization.
7. `07-development-roadmap.md`: Phased implementation roadmap, including the database provisioning pipeline (how new tenant schemas are generated and migrated dynamically).

Please write all documentation in Portuguese, but keep standard technical terms in English (e.g., Bounded Context, Multi-Tenant, Monolith, Schema-per-Tenant).

Go ahead and create the directory and the files now.
