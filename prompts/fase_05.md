Act as a Staff Software Engineer and Principal Algorithm Architect.

Your task is to fully implement the **Championships Module** inside our NestJS backend workspace. This module contains the core business logic of our SaaS: a high-performance tournament bracket and fixture generation engine.

You must strictly follow **Clean Architecture** principles, ensuring that all combinatorial algorithms are completely pure, stateless, and reside inside **Domain Services**. All tables and persistence operations must target the dynamic, active **Tenant Schema** via our `TenantConnectionManager`.

### Tournament Engine Architectural Specifications:

You must implement a domain engine capable of automatically generating matches, rounds, and elimination brackets for the following competition formats:

1. **Pontos Corridos (Turno / Turno e Retorno):** Standard round-robin format. You must implement the **Berger Tables Algorithm** (Circle Method) to generate perfectly balanced home/away match fixtures, avoiding consecutive home/away sequences where mathematically possible.
2. **Mata-Mata (Jogo Único / Ida e Volta):** Single or double-elimination brackets. The engine must handle seeding distributions (e.g., 1st vs 16th, 2nd vs 15th) and generate a clear tree structure of matches from Round of 16, Quarterfinals, Semifinals to Finals. It must also support "bye" slots if the number of teams is not a perfect power of 2.
3. **Fase de Grupos + Mata-Mata:** A hybrid tournament format. The engine must dynamically divide an arbitrary number of teams into $N$ groups, generate round-robin fixtures within each group, and pre-calculate the qualification slots that feed directly into a generated elimination bracket (e.g., Top 2 of each group advance to Quarterfinals).

### Directory Structure & Code Files to Generate:

Create the following file structure under `src/modules/championships/`, completely decoupled from external frameworks:

```text
src/modules/championships/
├── domain/
│   ├── entities/          # Championship, ChampionshipFormat, Category, Round, MatchStub
│   ├── value-objects/     # GroupConfiguration, BracketNode
│   ├── services/          # TournamentEngine.ts (The pure algorithmic heart containing Berger/Bracket algorithms)
│   └── repositories/      # IChampionshipRepository, IRoundRepository, ITeamRepository (Tenant-bound)
├── application/
│   ├── use-cases/         # CreateChampionshipUseCase, GenerateFixturesUseCase, GetBracketTreeUseCase
│   ├── dtos/              # CreateChampionshipDto, GenerateFixturesInputDto, BracketOutputDto
│   └── mappers/           # ChampionshipMapper, FixtureMapper
├── infrastructure/
│   └── repositories/      # DrizzleChampionshipRepository (Tenant-scoped via dynamic connection)
└── presentation/
    └── controllers/       # ChampionshipController (Endpoints: POST /championships, POST /championships/:id/generate-fixtures, GET /championships/:id/bracket)
```
