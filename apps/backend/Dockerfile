# Build context must be the monorepo root: docker build -f apps/backend/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY tsconfig.base.json ./
COPY apps/backend ./apps/backend
RUN pnpm --filter backend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
USER nestjs
EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"]
