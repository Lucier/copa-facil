Act as a Staff Software Engineer in Test (QA Architect) and DevOps Specialist.

Your task is to design, scaffold, and implement the complete **Quality Assurance and Testing Infrastructure** across our Multi-Tenant Sports SaaS workspace (Backend NestJS and Frontend Next.js).

You must replace traditional testing tools with **Vitest** for all Unit and Integration tests to ensure maximum execution speed and native TypeScript performance. The testing strategy must fully account for our **Schema-per-Tenant** architecture, meaning integration and E2E tests must validate multi-tenant isolation, dynamic schema switching, and header parsing.

### Target Tech Stack:

- **Unit & Integration Tests:** **Vitest** (utilizing parallel execution, mocking utilities, and native code coverage).
- **HTTP/API Integration & Contract Testing:** **Vitest** combined with native NestJS testing modules and a Swagger schema validator (e.g., `jest-openapi` adapted for Vitest or an OpenAPI schema assertion engine).
- **End-to-End (E2E) Browser Tests:** **Playwright** (testing critical front-to-back user journeys across custom subdomains).
- **API Documentation:** **Swagger UI** (`@nestjs/swagger`) with automated static JSON/YAML contract extraction.
- **Code Coverage Metric:** Strictly enforced **80% minimum coverage** (Statements, Branch, and Functions) via Vitest's V8 provider.

### Target Directory Structure to Create:

Scaffold the following configurations and directories inside the repository:

```text
/
├── .github/workflows/
│   └── test-pipeline.yml   # GitHub Actions test runner (Unit, Integration, Contract, E2E)
├── vitest.config.ts        # Global/Backend Vitest workspace configuration
├── playwright.config.ts    # Playwright browser testing orchestration file
├── docs/testing/
│   └── qa-strategy.md      # Comprehensive QA and Swagger documentation runbook
└── src/
    ├── config/
    │   └── swagger.config.ts # Central NestJS Swagger UI build configuration
    ├── modules/
    │   └── [module_name]/
    │       └── __tests__/   # Domain & Application unit tests (*.spec.ts)
    └── test/
        ├── integration/     # Tenant-aware API/DB & Swagger Contract tests (*.integration-spec.ts)
        ├── e2e/             # Playwright browser multi-tenant flows (*.e2e-spec.ts)
        ├── mocks/           # Centralized database, redis, and session mock factories
        └── setup.ts         # Vitest dynamic global setup (DB template spawning & Swagger schema loading)
```
