# API Gateway (Express)

## Tech Stack

- **Framework:** Express 5 + TypeScript.
- **Runtime:** Node.js 24 (Target for esbuild).
- **Logger:** `@repo/logger`.
- **Infrastructure:** Docker.

## Architecture

- **server.ts:** Contains the Express application logic, middleware, and route definitions.
- **index.ts:** The entry point that starts the server listener.

## Development Rules

- **Tooling:** Use `tsx watch` for development and `esbuild` for bundling.
- **Validation:** (Planned) Use Zod for request validation.
- **Persistence:** (Planned) Prisma ORM + PostgreSQL/pgvector (using UUID v7 for primary keys).
- **Auth:** (Planned) Better Auth.
