# Projet TFE : Faciliter l'accès au programme scolaire

## Description

Application web (microservices) destinée aux institutrices maternelles pour permettre une recherche sémantique et contextuelle au sein du programme scolaire belge (via RAG - Retrieval Augmented Generation).

## Technologies Principales

- **Monorepo:** Turborepo (`with-docker` template) avec `pnpm`.
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Ant Design 6 + TanStack (Query, Form/Zod, Table) + Orval (API Client).
- **API Gateway (Backend):** Express 5 + TypeScript + Prisma ORM + Better Auth.
- **Base de données:** PostgreSQL avec l'extension `pgvector` (Single Source of Truth) et IDs UUID v7.
- **Service IA (Worker):** Python (FastAPI).
  - _Note:_ Les technologies RAG (LlamaIndex, LlamaParse, modèles d'embedding) ne sont pas encore définitivement fixées et feront l'objet de tests.
- **Déploiement / DevOps:** Docker, Traefik, Ansible, VPS Ubuntu.

## Architecture

L'architecture est basée sur des microservices orchestrés via Docker. Le reverse proxy (Traefik) gère le trafic vers le Frontend ou l'API Gateway. L'API Gateway communique avec la base de données et délègue les tâches lourdes liées à l'IA au Service IA via des appels internes ou une future file d'attente (si nécessaire). Les fichiers PDF sont gérés via des volumes persistants partagés.

## Notes de développement

- **Local Host:** Always use `lighthouse.local` for local development. Ensure `127.0.0.1 lighthouse.local` is added to the system hosts file.
- **API Gateway:** Accessible at `http://lighthouse.local:3001`.
- **Frontend:** Accessible at `http://lighthouse.local:3000`.
- **Language:** All code comments and technical documentation MUST be written in English.
- **Ergonomics:** Prioritize accessibility and responsive design (tablets, mobile, PC).
- **Performance:** Target response times < 2s for semantic search.
- **GDPR:** Ensure local data hosting and anonymization where required.
