# Handoff : Stratégie de Tests Lighthouse

## 1. État Actuel

### Backend (`apps/api`) - **TERMINÉ (Logique & Intégration de base)**
- **Refactoring** : Logique métier extraite vers des fonctions pures.
- **Tests Unitaires** : 100% de couverture sur `chat-utils.ts`, `ingestion-utils.ts`, `usage-utils.ts`.
- **Tests d'Intégration** : 
  - `status.test.ts` : Health check et DB.
  - `chat.test.ts` : Gestion des conversations.
  - `document.test.ts` : Liste et suppression de documents.
  - `admin.test.ts` : Statistiques d'utilisation et utilisateurs (91% couverture controller).
- **Infrastructure** : `ApiError` corrigé pour une meilleure compatibilité Express/Jest.

### Frontend (`apps/web`) - **TERMINÉ (Composants Core Assistant)**
- **Infrastructure** : Vitest + RTL + JSDOM + `@vitest/coverage-v8`.
- **Tests Composants** :
  - `SourcePill.test.tsx` : Rendu et liens.
  - `Citations.test.tsx` : Liste des sources.
  - `ChatInput.test.tsx` : Interactions utilisateur (typing, send, disabled states).
- **Refactoring** : Extraction de `ChatInput` en composant autonome pour la testabilité.

### API Contracts (`packages/api`) - **TERMINÉ (Validation de Schémas)**
- **Infrastructure** : Jest configuré pour le package.
- **Tests** : 100% de couverture sur tous les schémas Zod (`admin`, `auth`, `chat`, `document`).
- **Robustesse** : Validation des payloads valides et détection d'erreurs sur payloads invalides.

## 2. Décisions Architecturales
- **Isolation des Mocks** : Utilisation systématique de `jest.mock` pour `@repo/db` et `better-auth` afin d'éviter les effets de bord.
- **Type Safety** : Tests écrits sans `any`, utilisant les types générés par Prisma et les interfaces partagées.
- **Global Coverage** : La commande `pnpm test:coverage` à la racine agrège maintenant correctement tous les packages.

## 3. Prochaines Étapes Suggérées

### Optionnel : Tests E2E (`apps/web`)
- Configurer Playwright pour des tests de bout en bout (flux complet de login -> chat -> citations).

### Intégration LLM
- Ajouter des tests utilisant des mocks de `ai` SDK pour tester le streaming complet dans `handleChat`.

## 4. Commandes Utiles
- `pnpm test` (racine) : Lance tous les tests du monorepo.
- `pnpm test:coverage` (racine) : Rapport de couverture global.
- `pnpm tsc` (racine) : Vérification des types sur tout le projet.

