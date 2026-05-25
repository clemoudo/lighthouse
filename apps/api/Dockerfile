FROM node:24-trixie-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Explicitly set the pnpm store directory for cache mounts
ENV PNPM_CONFIG_STORE_DIR=/pnpm/store
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
RUN apt-get update && apt-get install -y openssl tini curl && \
    curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash && \
    apt-get install -y infisical && \
    rm -rf /var/lib/apt/lists/*

# Global shell configuration to load .env automatically
COPY infra/bash_profile.sh /etc/profile.d/load_env.sh
RUN echo "source /etc/profile.d/load_env.sh" >> /etc/bash.bashrc

WORKDIR /app
COPY infra/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

FROM base AS pruner
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
# Use cache mount to persist pnpm store between builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM installer AS development
COPY --from=pruner /app/out/full/ .
COPY --from=base /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter @repo/db db:generate

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["pnpm", "--filter", "api", "dev"]

FROM installer AS builder
COPY --from=pruner /app/out/full/ .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma client and build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter @repo/db db:generate
RUN pnpm turbo run build --filter=api

# Deploy isolated API
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter=api --prod deploy --legacy /app/deploy

# Generate Prisma client inside the isolated directory so it's placed correctly in the deployed node_modules
WORKDIR /app/deploy
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm dlx prisma generate --schema=node_modules/@repo/db/prisma/schema.prisma

FROM base AS production
RUN addgroup --system --gid 1001 expressjs && \
    adduser --system --uid 1001 expressjs

# Create uploads directory and ensure correct ownership
RUN mkdir -p /app/uploads && chown -R expressjs:expressjs /app
USER expressjs

# Copy only the deployed app
COPY --from=builder --chown=expressjs:expressjs /app/deploy/dist ./apps/api/dist
COPY --from=builder --chown=expressjs:expressjs /app/deploy/package.json ./apps/api/package.json
COPY --from=builder --chown=expressjs:expressjs /app/deploy/node_modules ./node_modules

COPY --from=base /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["node", "apps/api/dist/index.js"]
