Act as a Staff Frontend Engineer and SEO Growth Architect.

Your task is to fully implement the **Public-Facing Tournament Portal** inside our Next.js 15 workspace. This is the white-label public website used by fans, athletes, and the press to follow tournaments in real-time.

Every tenant has its own public route sandbox (resolved via subdomains or route parameters, e.g., `tenant-slug.domain.com/` or `domain.com/[tenant]`). It must feature aggressive caching strategies, **Advanced SEO configurations**, and dynamic meta-tag generation to guarantee high search engine rankings and perfect social media link previews.

### Core Architecture & Hydration Strategies:

1. **SSR (Server-Side Rendering):** Must be used on highly dynamic pages like `Jogos`, `Tabela`, `Classificação`, and `Estatísticas` to guarantee that live match score updates are always fetched fresh from the active Tenant PostgreSQL Schema.
2. **SSG with ISR (Incremental Static Regeneration):** Must be used on `Home`, `Notícias`, and `Equipes` profiles (e.g., revalidate every 60 seconds) to ensure sub-millisecond response times, offloading database performance.

### Target Folder Structure to Create:

Inside our App Router directory, build the public portal structure parallel to the admin panel under the tenant dynamic route wrapper:

```text
src/app/[tenant]/
├── layout.tsx             # Public Layout Shell (Public Navbar, Footer, SEO Meta Injection)
├── page.tsx               # Home Page: Highlights, latest news, ongoing matches banner
├── championships/
│   └── page.tsx           # List of tournaments hosted by this organization
├── teams/
│   ├── page.tsx           # Directory of all teams in the league
│   └── [teamId]/page.tsx  # Team profile: Roster, recent results, next matches
├── matches/
│   ├── page.tsx           # Fixture list grid filtered by rounds/dates
│   └── [matchId]/page.tsx # Match Center: Lineups, real-time events timeline (goals, cards)
├── standings/
│   └── page.tsx           # Interactive League Tables (Points, Wins, Goal Differences)
├── statistics/
│   └── page.tsx           # Leaderboards (Top Scorers, Assists, Fair Play metrics)
└── news/
    ├── page.tsx           # News grid list with pagination
    └── [slug]/page.tsx    # Article view supporting Rich Text / Markdown renderers
```
