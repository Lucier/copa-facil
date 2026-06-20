Act as a Staff Software Engineer and Domain Modeler.

Your task is to fully implement the core participant modules: **Teams**, **Players**, and **Staff** inside our NestJS backend workspace. These modules are deeply interconnected and form the foundation of our sports management domain.

You must strictly adhere to **Clean Architecture** boundaries. All data, queries, and file-system assets (like team crests or uniforms) must be isolated within the active **Tenant Schema** context via our `TenantConnectionManager` and mapped logically to our object storage (MinIO).

### Domain & Business Specifications:

1. **Teams (Equipes):**
   - Full CRUD operations.
   - Metadata: Name, Acronym, City (Cidade), Nickname.
   - Assets: Logo/Crest (Escudo) URL and Uniform specifications (Primary/Secondary color hexes or asset URLs).
2. **Players (Jogadores):**
   - Roster management bound to a Team.
   - Metadata: Full Name, Birthdate, Document (CPF/Passaporte), Jersey Number, Preferred Foot/Hand.
   - Technical: Main Position (e.g., Goleiro, Zagueiro, Atacante) and Sub-positions.
   - History: Simple log system tracking tournament history, previous teams within the platform, and aggregate career stats (goals, cards).
3. **Staff (Comissão Técnica):**
   - Roster management bound to a Team.
   - Metadata: Full Name, Document, Registration/License Number.
   - Roles: Strict differentiation of specialized staff roles: `Técnico`, `Auxiliar`, `Médico`, `Preparador Físico`.

### Directory Structure & Code Files to Generate:

Create the following modular structure inside `src/modules/participants/` (or split into individual module folders `teams/`, `players/`, `staff/` under `src/modules/` if it fits our ongoing project convention better):

```text
src/modules/teams/
├── domain/
│   ├── entities/          # Team, Player, StaffMember (Aggregates and Entities)
│   ├── value-objects/     # UniformColors, Position, StaffRole
│   └── repositories/      # ITeamRepository, IPlayerRepository, IStaffRepository
├── application/
│   ├── use-cases/         # CreateTeamUseCase, RegisterPlayerUseCase, AssignStaffToTeamUseCase, TransferPlayerUseCase
│   ├── dtos/              # CreateTeamDto, RegisterPlayerDto, AssignStaffDto
│   └── mappers/           # TeamMapper, PlayerMapper, StaffMapper
├── infrastructure/
│   └── repositories/      # DrizzleTeamRepository, DrizzlePlayerRepository, DrizzleStaffRepository (Tenant-scoped)
└── presentation/
    └── controllers/       # TeamsController, PlayersController, StaffController
```
