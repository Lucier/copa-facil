Act as a Staff Software Engineer and Event-Driven Systems Architect.

Your task is to fully implement the core match execution and real-time statistics engine composed of the following modules: **Matches**, **Match Events**, **Statistics**, and **Standings** inside our NestJS backend workspace.

This system must be strictly decoupled using **Domain Events** and **Event Handlers** (via NestJS EventEmitter or a domain-driven custom pub/sub). When a match event (like a goal or card) is registered, it must fire an event that asynchronously recalculates standings and player statistics within the active, isolated **Tenant Schema**.

### Technical Architecture & Event Flow:

1. **Write Path (Command):** The user registers a `MatchEvent` (e.g., Goal). The `RegisterMatchEventUseCase` validates the action, persists it to the database, and publishes a `MatchEventRegisteredDomainEvent`.
2. **Read/Compute Path (Projection/Handlers):** Dedicated, stateless `EventHandlers` listen to this domain event and update the optimized read-models: `standings` (tabela de classificação) and `statistics` (artilharia, assistências, etc.).

### Domain Specifications to Implement:

#### 1. Match Events (Eventos de Partida)

- Types of events to support via strict Enums/Value Objects:
  - `GOL` (Requires: Player ID, Team ID, Minute, Assist Player ID [Optional], Type: Normal, Penalty, Contra).
  - `CARTAO` (Requires: Player ID, Team ID, Minute, Color: Amarelo, Vermelho).
  - `SUBSTITUICAO` (Requires: Team ID, Minute, PlayerOut ID, PlayerIn ID).
  - `EXPULSAO` (Direct red card or accumulation of two yellow cards).

#### 2. Automated Calculations (Statistics & Standings Engine)

Upon processing match conclusions or events, the engine must compute and persist:

- **Classificação (Standings):** Points ($3$ for Win, $1$ for Draw, $0$ for Loss), Matches Played, Wins, Draws, Losses, Goals For (Melhor Ataque), Goals Against (Melhor Defesa), Goal Difference.
- **Artilharia (Top Scorers):** Ranking of players by goal count.
- **Líderes de Assistências:** Ranking of players by assist count.
- **Fair Play Index:** Ranking of teams based on a weighted penalty system (e.g., Yellow Card = $1$ point, Red Card = $3$ points). The team with fewer points leads.

### Directory Structure & Code Files to Generate:

Create the following structure under `src/modules/match-engine/` following **Clean Architecture**:

```text
src/modules/match-engine/
├── domain/
│   ├── entities/          # Match, MatchEvent, Standing, PlayerStatistic, TeamStatistic
│   ├── value-objects/     # MatchStatus (Agendado, Em_Andamento, Encerrado), EventType
│   ├── events/            # MatchEventRegisteredEvent.ts, MatchConcludedEvent.ts
│   └── repositories/      # IMatchRepository, IMatchEventRepository, IStandingRepository, IStatisticRepository
├── application/
│   ├── use-cases/         # RegisterMatchEventUseCase, ConcludeMatchUseCase, GetStandingsUseCase, GetTopScorersUseCase
│   ├── handlers/          # UpdateStandingsHandler.ts, UpdatePlayerStatsHandler.ts, HandleFairPlayHandler.ts
│   └── dtos/              # RegisterMatchEventDto, StandingsOutputDto
├── infrastructure/
│   └── repositories/      # Drizzle repositories mapping to tenant-scoped tables
└── presentation/
    └── controllers/       # MatchesController, MatchEventsController, StandingsController, StatisticsController
```
