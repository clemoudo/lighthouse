# API Gateway (Express)

## Tech Stack

- **Framework:** Express 5 + TypeScript.
- **Runtime:** Node.js 24 (Target for esbuild).
- **Logger:** `@repo/logger`.
- **Infrastructure:** Docker.
- **Auth:** Better Auth.
- **Persistence:** Prisma ORM + PostgreSQL/pgvector (using UUID v7 for primary keys).

## Architecture

- **server.ts:** Contains the Express application logic, middleware, and route definitions.
- **index.ts:** The entry point that starts the server listener.
- **src/openapi.ts:** Defines the OpenAPI specification using `zod-to-openapi` for client generation (Orval).

## Development Rules

- **Tooling:** Use `pnpm build --watch` and `node --watch` (with `--env-file`) for development, and `esbuild` for bundling the production build.
- **Validation:** Use Zod for request validation and OpenAPI schema definition.
- **API Spec:** Update the OpenAPI schema whenever routes or schemas change to keep the frontend client in sync.
