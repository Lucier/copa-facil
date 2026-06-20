Act as a Principal DevOps Engineer and SRE (Site Reliability Engineering) Architect.

Your task is to fully design, configure, and implement the entire infrastructure, containerization, observability stack, and CI/CD pipelines for our Multi-Tenant Sports SaaS platform.

Every configuration must account for our **Schema-per-Tenant** architecture (requiring optimized PostgreSQL pooling, Redis telemetry for queue health with BullMQ, Nginx routing for wildcard subdomains, and dynamic environment configurations).

### Deliverables & Directory Structure

Please create the following files inside the workspace root. All configuration scripts, YAMLs, and Dockerfiles must be production-ready, highly secure, and adhere to industry cloud-native best practices (no stubs or placeholder values).

#### 1. Containerization & Routing (`/` root directory)

- `backend.Dockerfile`: Multi-stage build for NestJS (Node 22-alpine), caching `node_modules`, optimizing production dependencies, running as a non-root `node` user.
- `frontend.Dockerfile`: Multi-stage build for Next.js 15 (Node 22-alpine) optimizing `.next/standalone` production output and sharp image dependencies.
- `mobile.Dockerfile`: Scaffolding container for building/exporting Expo Android/iOS bundles (using EAS CLI or standard metro bundling prerequisites).
- `nginx.conf`: Nginx configuration acting as a Reverse Proxy and Load Balancer. It must handle wildcard subdomains (e.g., `*.championships.saas.com`), inject CORS headers, proxy WebSockets (`/socket.io`) cleanly to the NestJS cluster, and pass the original host header so the backend can resolve the active Tenant Schema.

#### 2. Local & Production Orchestration

- `docker-compose.yml`: Local engineering environment orchestrating:
  - **PostgreSQL:** With custom health checks (`pg_isready`), volume persistence, and initial shared-schema seeding linkages.
  - **Redis:** Configured with password protection and automated maxmemory policies.
  - **MinIO:** Object storage setup with custom bucket creation scripts for tenant assets via CLI (`mc`).
  - **Backend & Frontend:** Wired with hot-reloading configurations, network aliases, and automated service dependencies.
- `docker-compose.prod.yml`: Hardened, production-ready compose specification mapping secure environment variable files, imposing CPU/Memory resource limits (`deploy.resources`), setting up logging drivers (JSON-file log rotation), and stripping development port mappings.

#### 3. Enterprise Observability Stack (`/config/monitoring/`)

Configure full instrumentation using OpenTelemetry:

- `otel-collector-config.yaml`: Configuration mapping trace/metric collection inputs from NestJS and shipping them to target backends.
- `prometheus.yml`: Monitoring configuration scraping system metrics from the NestJS OpenTelemetry plugin, PostgreSQL exporter, and Redis exporter.
- `grafana/dashboards/`: Provisioned dashboards json files delivering live charts tracking: API Request Latency (p95, p99), Active Tenant Connection Pools, BullMQ Queue Backlogs (failed/active jobs), and Postgres read/write load.

#### 4. Automated CI/CD Pipelines (`.github/workflows/`)

- `ci.yml` (Trigger: PR & Push to `main`/`develop`): Multi-job pipeline executing parallel linting (`eslint`), security auditing (`npm audit`), automated database schema verification testing (`drizzle-kit check`), and full unit/integration test suites runner.
- `cd.yml` (Trigger: Push to `main`): Multi-stage continuous deployment pipeline building production Docker images via **Docker Buildx**, caching layer states, pushing to an Elastic Container Registry (ECR/DockerHub), auto-generating database migrations execution scripts, and pushing deployment triggers to target cloud servers (SSH/Webhooks).

#### 5. Operations & Runbook Documentation

Produce a highly comprehensive markdown file `docs/operations-runbook.md` in Portuguese detailing:

1. **Bootstrap Guide:** Step-by-step commands to bring up the local stack, seed it, and verify that the Nginx wildcard layer is working.
2. **Tenant Provisioning Devops Blueprint:** Explanation of how the infrastructure reacts when a new customer purchases a plan and a new PostgreSQL Schema needs to be spun up and migrated.
3. **SRE Runbook:** Instructions on how to interpret the Grafana alerts (e.g., what to do if the PostgreSQL tenant connection pool saturates).

Go ahead and generate all Dockerfiles, orchestration scripts, monitoring YAMLs, and GitHub workflows now.
