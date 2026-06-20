# Build context: monorepo root
# docker build -f apps/mobile/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable \
    && npm install -g @expo/eas-cli@latest

FROM base AS deps
WORKDIR /app
COPY apps/mobile/package.json ./
RUN npm install --legacy-peer-deps

FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/mobile .
EXPOSE 8081 19000 19001 19002
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
CMD ["npx", "expo", "start", "--port", "8081", "--host", "tunnel"]

FROM base AS eas-build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/mobile .
ARG EAS_PROJECT_ID
ARG EXPO_TOKEN
ENV EAS_PROJECT_ID=${EAS_PROJECT_ID}
ENV EXPO_TOKEN=${EXPO_TOKEN}
CMD ["eas", "build", "--platform", "all", "--non-interactive"]
