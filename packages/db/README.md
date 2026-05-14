# Database Package (`@repo/db`)

Ce package gère la couche de persistance des données via Prisma ORM.

## 🛠️ Stack Technique

- **ORM**: Prisma 7.
- **Base de données**: PostgreSQL.
- **Extensions**: `pgvector` pour la recherche sémantique.
- **IDs**: UUID v7 (pour un meilleur tri chronologique et performance).

## 🚀 Commandes utiles

- `pnpm generate`: Génère le client Prisma.
- `pnpm db:push`: Synchronise le schéma Prisma avec la base de données (utile en dev).
- `pnpm db:migrate`: Crée une nouvelle migration (pour la production).
- `pnpm db:studio`: Ouvre l'interface graphique Prisma Studio pour explorer les données.

## 📁 Structure

- `prisma/schema.prisma`: Définition du modèle de données.
- `src/index.ts`: Exporte l'instance du client Prisma partagée.
