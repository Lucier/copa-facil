Act as a Staff Frontend Engineer and UI/UX Architect.

Your task is to bootstrap the entire initial boilerplate, folder structure, and core dashboard shells for our **Administrative Multi-Tenant Frontend** using **Next.js 15 (App Router)** and **React 19**.

This frontend is the control panel utilized by league organizers to manage their tournaments. It must dynamically resolve the tenant context (via subdomain parsing, e.g., `tenant-slug.domain.com/admin` or request headers) and pass this routing context to our Axios/Fetch API client layer.

### Tech Stack Details:

- **Framework:** Next.js 15 (App Router, utilizing Server Components for layouts and Client Components for interactive dashboards)
- **React version:** React 19 (ready for Server Actions and native form hooks)
- **Styling & Components:** Tailwind CSS & Shadcn UI (Radix Primitives)
- **State Management & Data Fetching:** Zustand (Global UI states, theme, auth tokens) & TanStack Query v5 (Server state caching)
- **Forms & Validation:** React Hook Form & Zod
- **Core Features:** Strict Dark Mode support (via `next-themes`), 100% Mobile Responsive design, and Internationalization (i18n) routing structure.

### Target Folder Structure to Create:

Inside the root of the Next.js application (`src/`), you must create and scaffold the following directories using a scalable, feature-based or atomic architecture layout:

```text
src/
├── app/
│   └── [tenant]/
│       └── admin/
│           ├── layout.tsx         # Main Admin Shell layout (Sidebar, Header, Auth guards)
│           ├── page.tsx           # Dashboard Overview metrics
│           ├── championships/     # CRUD views for Tournaments, Bracket views
│           ├── teams/             # Team roster management screens
│           ├── players/           # Player compliance and profile views
│           ├── matches/           # Live score entry and match scheduling screens
│           ├── statistics/        # Leaderboards and historical summaries
│           ├── cms/               # Article and Media gallery managers
│           └── settings/          # Tenant profile, custom domains, and configurations
├── components/
│   ├── ui/                # Shadcn UI primitives (Button, Card, Dialog, Table, Form, Input, Sidebar)
│   └── admin/             # Reusable shared layout components (AdminSidebar, TenantSwitcher, NotificationBell)
├── hooks/                 # Global React hooks (useTenant, useAuth)
├── services/              # API clients, axios interceptors with automatic tenant header injection
├── store/                 # Zustand store definitions (useUIStore, useAuthStore)
└── lib/                   # Utility functions, tailwind-merge configuration, zod schemas
```
