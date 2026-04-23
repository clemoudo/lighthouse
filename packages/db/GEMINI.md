# Database Package (@repo/db)

## Tech Stack

- **ORM:** Prisma 7.
- **Database:** PostgreSQL with `pgvector`.
- **Primary Keys:** UUID v7.

## Usage

- Exports the `PrismaClient` and all generated types from `./src/index.ts`.
- Used by `apps/api` for backend persistence.

## Development Rules

- **Schema Changes:** Modify `prisma/schema.prisma` and run `pnpm generate` to update the client.
- **Migrations:** Use `pnpm db:push` for development changes or standard migrations for production.
