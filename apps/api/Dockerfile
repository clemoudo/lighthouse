FROM node:24-trixie-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y openssl tini curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM installer AS development
COPY --from=pruner /app/out/full/ .
CMD ["pnpm", "--filter", "api", "dev"]

FROM installer AS builder
COPY --from=pruner /app/out/full/ .
# Injects build-time env vars if needed
ARG DATABASE_URL
ARG API_PORT
# Generate Prisma Client for the build
RUN pnpm --filter @repo/db generate
RUN pnpm turbo run build --filter=api
# Deploy only the API and its prod dependencies to /app/deploy
RUN pnpm --filter=api --prod deploy /app/deploy

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 expressjs && \
    adduser --system --uid 1001 expressjs
USER expressjs

# Copy only the deployed app
COPY --from=builder --chown=expressjs:expressjs /app/deploy/dist ./apps/api/dist
COPY --from=builder --chown=expressjs:expressjs /app/deploy/package.json ./apps/api/package.json
COPY --from=builder --chown=expressjs:expressjs /app/deploy/node_modules ./node_modules

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/api/dist/index.js"]
