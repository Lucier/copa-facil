Act as a Staff Mobile Engineer and Cross-Platform Architect.

Your task is to bootstrap the entire initial boilerplate, folder structure, and core navigation flows for our **Multi-Tenant Sports App** using **React Native (Expo SDK)** and **TypeScript**.

The app must adapt its layout and features dynamically according to the logged-in user profile (`Organizador`, `Árbitro`, `Jogador`, `Torcedor`) and handle the active **Schema-per-Tenant** multi-tenancy context by injecting the tenant identification header (`X-Tenant-ID`) into all mobile API network requests via TanStack Query.

### Tech Stack Details:

- **Framework:** Expo (using the latest stable SDK)
- **Navigation:** Expo Router (File-based routing with typed routes)
- **State Management:** Zustand (Handling auth tokens, user profiles, current tenant context, and notification counters)
- **Data Fetching & Sync:** TanStack Query v5 (React Query) with offline caching capability primitives
- **UI Components:** NativeWind (Tailwind CSS for React Native) or clean StyleSheet abstractions optimized for both iOS and Android.

### Target Folder Structure to Create:

Inside the root of the Expo application (`src/` or root project), you must create and scaffold the following directories using the file-based conventions of Expo Router:

```text
app/                     # Expo Router Root directory
├── index.tsx            # Splash / Tenant discovery & Landing Screen
├── auth/                # Authentication flow (Login, Recovery)
│   ├── login.tsx
│   └── select-tenant.tsx
├── (tabs_fan)/          # Torcedor/Public Flow (Home, Matches, Standings)
│   ├── _layout.tsx
│   ├── index.tsx
│   └── live-scores.tsx
├── (tabs_referee)/      # Árbitro Flow (Match sheet entry, event triggers)
│   ├── _layout.tsx
│   └── match-control.tsx
└── (drawer_admin)/      # Organizador Flow (Full mobile dashboard)
    ├── _layout.tsx
    └── metrics.tsx
src/
├── components/          # Reusable UI Atoms and Molecules (Cards, Scoreboards, MatchTimeline)
├── hooks/               # Custom hooks (useAuth, useTenantCrypto, useSignalR)
├── services/            # Axios API client configured with interceptors for dynamic tenant routing
├── store/               # Zustand global mobile slice stores (authStore, tenantStore)
└── types/               # Strict TypeScript definitions for Profiles and Match Models
```
