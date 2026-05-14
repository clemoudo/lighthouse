# Lighthouse 🏛️

**Faciliter l'accès au programme scolaire belge via l'intelligence artificielle.**

Lighthouse est une plateforme web conçue pour les institutrices maternelles en Belgique. Elle permet une recherche sémantique et contextuelle au sein du programme scolaire grâce à une architecture RAG (Retrieval Augmented Generation).

## 🚀 Guide de démarrage rapide (Local)

Ce projet utilise un monorepo géré par **Turborepo** avec **pnpm**.

### 📋 Prérequis

- **Node.js**: >= 24.0.0
- **pnpm**: >= 11.0.0
- **Docker & Docker Compose**: Pour le déploiement de l'application.
- **Infisical CLI**: Utilisé pour la gestion sécurisée des variables d'environnement.
- **Configuration des hôtes**: Ajouter `127.0.0.1 lighthouse.local` à votre fichier `/etc/hosts` (Linux/macOS) ou `C:\Windows\System32\drivers\etc\hosts` (Windows).

### 🛠️ Installation

1. **Cloner le projet**

   ```bash
   git clone git@github.com:clemoudo/lighthouse.git
   cd lighthouse
   ```

2. **Installer les dépendances**

   ```bash
   pnpm install
   ```

3. **Lancer l'infrastructure (Docker)**
   Cette commande lance PostgreSQL (avec pgvector) et Traefik.

   ```bash
   pnpm docker:dev
   ```

4. **Préparer la base de données**

   ```bash
   docker exec -it api pnpm db:push
   ```

L'application sera accessible sur :

- **Frontend**: [http://lighthouse.local:3000](http://lighthouse.local:3000)
- **API Gateway**: [http://lighthouse.local:3001](http://lighthouse.local:3001)

---

## 🏗️ Architecture du projet

Le projet est divisé en plusieurs applications et packages :

### Applications (`apps/`)

- [**web**](./apps/web): Interface utilisateur Next.js 16.
- [**api**](./apps/api): Gateway API Express 5 gérant l'authentification et la logique métier.

### Packages (`packages/`)

- [**api**](./packages/api): Définitions OpenAPI et schémas Zod partagés.
- [**db**](./packages/db): Couche d'accès aux données (Prisma ORM).
- [**logger**](./packages/logger): Utilitaire de logging unifié.
- [**eslint-config**](./packages/eslint-config): Configurations ESLint partagées.
- [**typescript-config**](./packages/typescript-config): Configurations TypeScript partagées.
- [**prettier-config**](./packages/prettier-config): Configuration Prettier partagée.
- [**jest-presets**](./packages/jest-presets): Configurations Jest partagées.

## 🛠️ Stack Technique

- **Frontend**: Next.js 16 (App Router), Ant Design 6, Tailwind CSS v4, TanStack Query.
- **Backend**: Express 5, Better Auth, Prisma ORM.
- **Base de données**: PostgreSQL + pgvector.
- **DevOps**: Docker, Traefik, Ansible, Infisical.

## 📄 Licence

Ce projet est réalisé dans le cadre d'un Travail de Fin d'Études (TFE) à l'EPHEC.
