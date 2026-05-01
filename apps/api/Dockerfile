FROM node:24-trixie-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y openssl tini curl && \
    curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash && \
    apt-get install -y infisical && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY infra/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

FROM base AS pruner
RUN npm install -g turbo
COPY . .
RUN turbo prune api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM installer AS development
COPY --from=pruner /app/out/full/ .
COPY --from=base /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["pnpm", "--filter", "api", "dev"]

FROM installer AS builder
COPY --from=pruner /app/out/full/ .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma Client for the build
RUN pnpm --filter @repo/db generate
RUN pnpm turbo run build --filter=api
# Deploy only the API and its prod dependencies to /app/deploy
RUN pnpm --filter=api --prod deploy /app/deploy

FROM base AS production
RUN addgroup --system --gid 1001 expressjs && \
    adduser --system --uid 1001 expressjs
USER expressjs

# Copy only the deployed app
COPY --from=builder --chown=expressjs:expressjs /app/deploy/dist ./apps/api/dist
COPY --from=builder --chown=expressjs:expressjs /app/deploy/package.json ./apps/api/package.json
COPY --from=builder --chown=expressjs:expressjs /app/deploy/node_modules ./node_modules

COPY --from=base /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["node", "apps/api/dist/index.js"]
