# Handoff : Stratégie de Tests Lighthouse

## 1. État Actuel

### Backend (`apps/api`) - **TERMINÉ (Logique Pure)**
- **Refactoring** : La logique métier critique a été extraite des services (`UsageService`, `ChatService`, `IngestionService`) vers des fonctions pures dans `src/lib/utils/`.
- **Tests** : 17 tests unitaires passent (`pnpm test` dans `apps/api`).
  - `usage-utils.ts` : Calcul des quotas par rôle.
  - `chat-utils.ts` : Formatage RAG et génération de prompts (Félix).
  - `ingestion-utils.ts` : Mapping des chunks et filtrage des pages vides.

### Frontend (`apps/web`) - **EN COURS (Infrastructure en place)**
- **Infrastructure** : Vitest, React Testing Library et JSDOM sont installés et configurés.
- **Setup** : Fichier `src/test/setup.ts` créé pour mocker les APIs manquantes dans JSDOM (`matchMedia`, `ResizeObserver`) nécessaires pour Ant Design 6.
- **Premiers Tests** :
  - `ComingSoon.test.tsx` : Vérifie le rendu de base d'un composant Ant Design.
  - `pdf-utils.test.ts` : Teste la logique de navigation des pages (spreads).

## 2. Décisions Architecturales
- **Priorité aux Fonctions Pures** : On isole systématiquement la logique de transformation de données des effets de bord (DB, API).
- **Mocks Ant Design** : Le setup global (`setup.ts`) est crucial pour éviter que les tests n'échouent à cause de composants AntD complexes.

## 3. Prochaines Étapes Immédiates

### Priorité 1 : Composants Assistant (`apps/web`)
- Créer `src/components/assistant/__tests__/source-pill.test.tsx` (J'avais commencé à l'analyser).
- Tester `Citations` et la gestion de l'affichage des sources.
- Tester `ChatInput` (interactions utilisateur).

### Priorité 2 : Controllers API (`apps/api`)
- Ajouter des tests d'intégration avec `supertest` pour les routes complexes (`/api/chat`).
- Mock l'authentification (Better Auth) dans les tests.

### Priorité 3 : Validation de Schémas (`packages/api`)
- Tester les Zod schemas avec des payloads invalides pour garantir la robustesse des contrats API.

## 4. Commandes Utiles
- `pnpm test` (dans chaque app) pour lancer la suite.
- `vitest config` est dans `apps/web/vitest.config.ts`.
