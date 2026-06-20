Act as a Staff Database Engineer and Backend Architect.

Based on our approved architecture for the Multi-Tenant Sports Championship SaaS, your task is to design and implement the entire PostgreSQL database layer using **Drizzle ORM** inside our NestJS backend workspace, strictly adhering to a **Schema-per-Tenant** isolation architecture.

### Core Architecture Requirements (Schema-per-Tenant Style):

1. **Multi-Tenancy Isolation:**
   - **Shared/Global Schema (`public` or `core`):** Must contain centralized, platform-wide tables: `organizations`, `users`, and system-wide configurations.
   - **Tenant Schemas (Dynamic):** All competition, business, and operational data must live inside isolated PostgreSQL schemas dedicated to each tenant.
   - _Drizzle Instruction:_ Use Drizzle's `pgSchema` feature to define and export both the core schemas and the tenant-scoped template schemas so they can be instantiated or queried dynamically at runtime (e.g., using a dynamic connection pool switcher or runtime `SET search_path`).
2. **IDs:** Every single table across both shared and tenant schemas must use `uuid` (v4) as its Primary Key.
3. **Soft Delete:** Include `deleted_at (timestamp)` fields across all applicable tenant-specific entities, ensuring queries filter out deleted records.
4. **Audit Trail:** Every entity must have `created_at` and `updated_at`. Ensure interactions are loggable to the `audit_logs` table (which resides inside each tenant's schema for compliance and isolation).

### Target Entities & Schema Distribution:

- **Shared/Global Schema (`src/modules/database/schema/shared.ts`):**
  - `organizations` (The master list of tenants, mapping domains/subdomains to their specific PostgreSQL schema name)
  - `users` (Global credentials/auth accounts)
  - `global_permissions` / `global_roles` (Platform-level roles, e.g., Support, Admin)

- **Tenant Schema Templates (`src/modules/database/schema/tenant/`):**
  - `auth_acl.ts`: `roles`, `permissions`, `memberships` (Tenant-specific Access Control)
  - `championships.ts`: `championships`, `championship_formats`, `categories`, `registrations`, `payments`
  - `matches.ts`: `teams`, `players`, `staff`, `matches`, `match_events`, `lineups`
  - `core_ops.ts`: `standings`, `statistics`, `news`, `media`, `notifications`, `audit_logs`

### Deliverables & Directory Structure

Please create the following files in the repository. Ensure all TypeScript code is production-ready, strictly typed, and properly exported.

#### 1. Documentation (`docs/database/`)

- `db-design-and-der.md`: Detailed documentation of the shared vs. tenant schema split, fields, foreign keys, indexing strategy, and an entity-relationship summary using Mermaid. Explain how dynamic tenant schemas are isolated.

#### 2. Drizzle Schemas (`src/modules/database/schema/`)

Create the modular schema files as described in the distribution list above using Drizzle ORM (`pgTable` and `pgSchema`).

- Define explicit foreign key constraints with proper `onDelete` behaviors (ensure cross-schema FKs from Tenant to Shared schema are avoided or handled according to Postgres best practices—prefer logical correlation for `user_id`).
- Implement performance indexes (e.g., indexes on foreign keys, lookups, and `deleted_at`).

#### 3. Database Config & Migration Strategy (`src/modules/database/`)

- `drizzle.config.ts`: Configuration file for Drizzle Kit. It must account for migrating the shared schema and provide a strategy for generating/applying the tenant template schema to new database schemas dynamically.
- `src/modules/database/migration-strategy.md`: Technical guide explaining the CI/CD deployment pipeline for running migrations across _all_ existing tenant schemas when a template changes, and how a new tenant schema is provisioned dynamically at runtime.

#### 4. Seed Strategy (`src/modules/database/seeds/`)

- `src/modules/database/seeds/initial-seed.ts`: A production-grade seeding script using Drizzle syntax to populate global data in the shared schema and a step-by-step example of creating a sample tenant schema (e.g., `tenant_demo`) and seeding it with initial data.

Write code in clean TypeScript and document explanations in Portuguese. Go ahead and generate the schema files and architecture docs now.
