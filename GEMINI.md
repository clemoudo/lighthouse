# Projet TFE : Faciliter l'accès au programme scolaire

## Description

Application web (microservices) destinée aux institutrices maternelles pour permettre une recherche sémantique et contextuelle au sein du programme scolaire belge (via RAG - Retrieval Augmented Generation).

## Technologies Principales

- **Monorepo:** Turborepo (`with-docker` template) avec `pnpm`.
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- **API Gateway (Backend):** Express.js + TypeScript + Prisma ORM + Better Auth.
- **Base de données:** PostgreSQL avec l'extension `pgvector` (Single Source of Truth).
- **Message Queue / Cache:** Redis.
- **Service IA (Worker):** Python (FastAPI).
  - _Note:_ Les technologies RAG (LlamaIndex, LlamaParse, modèles d'embedding) ne sont pas encore définitivement fixées et feront l'objet de tests.
- **Déploiement / DevOps:** Docker (à sécuriser), Traefik, Ansible, VPS AlmaLinux.

## Architecture

L'architecture est basée sur des microservices orchestrés via Podman/Docker. Le reverse proxy (Traefik) gère le trafic vers le Frontend ou l'API Gateway. L'API Gateway communique avec la base de données et délègue les tâches lourdes liées à l'IA au Service IA via une file d'attente (Redis) ou des appels internes. Les fichiers PDF sont gérés via des volumes persistants partagés.

## Notes de développement

- All code comments MUST be written in English.
- Veiller à l'ergonomie et l'accessibilité (tablettes, mobile, PC).
- Garantir des temps de réponse rapides (< 2s pour la recherche sémantique).
- Respecter les contraintes GDPR (hébergement local des données, anonymisation).
