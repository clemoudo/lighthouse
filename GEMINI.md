# Project GEMINI.md (Consolidated)

This file contains all the technical instructions and context for the Lighthouse project, gathered from various `GEMINI.md` files across the monorepo.

---

## Root Instructions (`./GEMINI.md`)

# Projet TFE : Faciliter l'accès au programme scolaire

### Description

Application web (microservices) destinée aux institutrices maternelles pour permettre une recherche sémantique et contextuelle au sein du programme scolaire belge (via RAG - Retrieval Augmented Generation).

### Technologies Principales

- **Monorepo:** Turborepo (`with-docker` template) avec `pnpm`.
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Ant Design 6 + TanStack (Query, Form/Zod, Table) + Orval (API Client).
- **API Gateway (Backend):** Express 5 + TypeScript + Prisma ORM + Better Auth.
- **Base de données:** PostgreSQL avec l'extension `pgvector` (Single Source of Truth) et IDs UUID v7.
- **Service IA (Worker):** Python (FastAPI).
  - _Note:_ Les technologies RAG (LlamaIndex, LlamaParse, modèles d'embedding) ne sont pas encore définitivement fixées et feront l'objet de tests.
- **Déploiement / DevOps:** Docker, Traefik, Ansible, VPS Ubuntu.

### Architecture

L'architecture est basée sur des microservices orchestrés via Docker. Le reverse proxy (Traefik) gère le trafic vers le Frontend ou l'API Gateway. L'API Gateway communique avec la base de données et délègue les tâches lourdes liées à l'IA au Service IA via des appels internes ou une future file d'attente (si nécessaire). Les fichiers PDF sont gérés via des volumes persistants partagés.

### Notes de développement

- **Local Host:** Always use `lighthouse.local` for local development. Ensure `127.0.0.1 lighthouse.local` is added to the system hosts file.
- **API Gateway:** Accessible at `http://lighthouse.local:3001`.
- **Frontend:** Accessible at `http://lighthouse.local:3000`.
- **Language:** All code comments and technical documentation MUST be written in English.
- **Ergonomics:** Prioritize accessibility and responsive design (tablets, mobile, PC). Use Ant Design 6 components as the primary UI library for consistency.
- **Entry Point:** The application redirects by default to the AI Assistant (`/assistant`).
- **Performance:** Target response times < 2s for semantic search.
- **GDPR:** Ensure local data hosting and anonymization where required.

---

## Web Application (`./apps/web/GEMINI.md`)

# Web Application (Next.js)

### Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Infrastructure:** Docker.
- **Styling:** Tailwind CSS v4 (CSS-first mode).
- **UI Library:** Ant Design 6.
- **API Client:** Orval (Auto-generated with TanStack Query).
- **State/Forms/Tables:** TanStack Query, TanStack Form (+ Zod).
- **Theming:** `next-themes` + Ant Design ConfigProvider.

### Critical Rules

- **Access:** Reached via `http://lighthouse.local`.
- **API Routing:** All backend requests go through Traefik which STRIPS the `/api` prefix. For example, a request to `http://lighthouse.local/api/auth` reaches the backend as `/auth`.
- **Hydration:** Always include `suppressHydrationWarning` on the `<html>` tag in `layout.tsx` to prevent mismatches from theme scripts or extensions.
- **Ant Design Registry:** Ensure `AntdRegistry` from `@ant-design/nextjs-registry` wraps the application in `layout.tsx`.
- **API Generation:** Use `pnpm generate-api` to update the API client from the backend's OpenAPI spec. Generated code is located in `@repo/api` but used via React Query hooks.
- **Tailwind v4:** Variables and theme configuration are located in `src/app/globals.css`. Use `@theme inline` for custom tokens.
- **Icons:** Use `lucide-react`.

### UI & Layout Conventions

- **Ant Design First:** Favor `Flex`, `Space`, `Typography`, and `Card` from Ant Design for layout and text over raw HTML/Tailwind where possible to maintain theme consistency.
- **Page Headers:** Use the `PageHeader` component for consistent titles and descriptions across pages.
- **Navigation:** New features are marked as `disabled` with a "Prochainement disponible" `Tooltip` in the `AppShell` until fully implemented.
- **Chatbot Interface:** The AI Assistant (`/assistant`) uses a modern, immersive layout:
  - No `PageHeader` or containing `Card`.
  - Centered message stream (max-width 4xl).
  - Sticky bottom input with backdrop blur.
  - Assistant messages: White background with border.
  - User messages: Primary color background.

### Theme

- The application uses `oklch()` color tokens defined in `globals.css`.
- Ant Design tokens should be synchronized with Tailwind variables when possible via `ConfigProvider` in `Providers`.

---

## API Gateway (`./apps/api/GEMINI.md`)

# API Gateway (Express)

### Tech Stack

- **Framework:** Express 5 + TypeScript.
- **Runtime:** Node.js 24 (Target for esbuild).
- **Logger:** `@repo/logger`.
- **Infrastructure:** Docker.
- **Auth:** Better Auth.
- **Persistence:** Prisma ORM + PostgreSQL/pgvector (using UUID v7 for primary keys).

### Architecture

- **server.ts:** Contains the Express application logic, middleware, and route definitions.
- **index.ts:** The entry point that starts the server listener.
- **src/openapi.ts:** Defines the OpenAPI specification using `zod-to-openapi` for client generation (Orval).

### Development Rules

- **Access:** Reached via `http://lighthouse.local/api`.
- **Routing:** Traefik STRIPS the `/api` prefix before forwarding to this service. Internal routes (like Better Auth) should NOT include `/api` in their `basePath`.
- **Tooling:** Use `pnpm build --watch` and `node --watch` (with `--env-file`) for development, and `esbuild` for bundling the production build.
- **Validation:** Use Zod for request validation and OpenAPI schema definition.
- **API Spec:** Update the OpenAPI schema whenever routes or schemas change to keep the frontend client in sync.

---

## API Definitions (`./packages/api/GEMINI.md`)

# API Definitions (@repo/api)

### Purpose

Centralized OpenAPI specification and schema definitions shared between the API Gateway and the Web Application.

### Tech Stack

- **Zod:** Used for schema definitions.
- **zod-to-openapi:** Generates OpenAPI 3.0 specification from Zod schemas.

### Architecture

- **src/schemas/:** Contains Zod schemas for all API entities and request/response bodies.
- **src/openapi.ts:** Combines schemas into a complete OpenAPI specification.
- **openapi.json:** The generated OpenAPI file (used by Orval in the web app).

### Development Rules

- **Schema Changes:** Always update schemas in this package before implementing them in the API or using them in the Web app.
- **Generation:** Run `pnpm generate-openapi` in this package to update `openapi.json` after making changes to the Zod definitions.

---

## Database Package (`./packages/db/GEMINI.md`)

# Database Package (@repo/db)

### Tech Stack

- **ORM:** Prisma 7.
- **Database:** PostgreSQL with `pgvector`.
- **Primary Keys:** UUID v7.

### Usage

- Exports the `PrismaClient` and all generated types from `./src/index.ts`.
- Used by `apps/api` for backend persistence.

### Development Rules

- **Schema Changes:** Modify `prisma/schema.prisma` and run `pnpm generate` to update the client.
- **Migrations:** Use `pnpm db:push` for development changes or standard migrations for production.

---

## Logger Package (`./packages/logger/GEMINI.md`)

# Logger Package (@repo/logger)

### Purpose

Provides a consistent logging interface across the monorepo (API and Web).

### Usage

- Export simple logging functions or a logger instance from `src/index.ts`.
- Ensure compatibility with both Node.js and Browser environments.

### Development

- **Build:** Uses `tsc` to compile to `dist`.
- **Testing:** Jest is configured for unit tests.
