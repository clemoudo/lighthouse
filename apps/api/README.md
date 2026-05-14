# API Gateway (`apps/api`)

Ce service sert de point d'entrée unique pour toutes les requêtes du frontend. Il gère l'authentification, la validation des données et la communication avec la base de données.

## 🛠️ Stack Technique

- **Framework**: Express 5 + TypeScript.
- **Runtime**: Node.js 24.
- **Authentification**: [Better Auth](https://www.better-auth.com/).
- **ORM**: Prisma 7.
- **Validation**: Zod.
- **Documentation**: OpenAPI 3.0 (généré via `zod-to-openapi`).

## 📁 Structure

- `src/server.ts`: Configuration d'Express, middleware et routes.
- `src/lib/auth.ts`: Configuration de Better Auth.
- `src/middlewares/`: Middlewares personnalisés (ex: authentification).
- `src/types/`: Définitions de types TypeScript.
