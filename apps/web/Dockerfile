FROM node:24-trixie-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y openssl tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM installer AS development
COPY --from=pruner /app/out/full/ .
CMD ["pnpm", "--filter", "web", "dev"]

FROM installer AS builder
COPY --from=pruner /app/out/full/ .

# CRITICAL: Next.js needs these at BUILD TIME to bake them into the JS bundle
ARG NEXT_PUBLIC_API_HOST
ARG BASE_DOMAIN
ARG API_HOST
ARG API_PORT
ARG WEB_HOST
ARG WEB_PORT

RUN pnpm turbo run build --filter=web

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/web/server.js"]
