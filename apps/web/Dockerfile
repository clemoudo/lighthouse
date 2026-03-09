ARG NODE_VERSION=24.13.1
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Set working directory
WORKDIR /app

# ---
FROM base AS prepare
RUN npm install -g turbo
COPY . .
# Add lockfile and package.json's of isolated subworkspace
RUN turbo prune web --docker

# ---
FROM base AS builder
WORKDIR /app
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=prepare /app/out/full/ .

# Enable remote caching for Turborepo
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build

# ---
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
# Don't run production as root for security reasons
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js
