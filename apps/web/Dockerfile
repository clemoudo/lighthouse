ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS prepare
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

FROM base AS builder
WORKDIR /app
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=prepare /app/out/full/ .

# Build variables
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm turbo build

# TODO use dhi.io/node:${NODE_VERSION}
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Security and Compatibility
RUN apk add --no-cache libc6-compat tini
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Next.js standalone selective copy (already optimized)
COPY --from=builder --chown=nextjs:nodejs --chmod=555 /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs --chmod=555 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs --chmod=555 /app/apps/web/public ./apps/web/public

# Use Tini as Init process
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
