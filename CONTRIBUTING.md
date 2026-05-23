# Guide de contribution - Lighthouse

Ce document définit les standards techniques et les conventions de développement pour le projet "Faciliter l'accès au programme scolaire".

## 1. Gestion des branches Git

Le projet utilise une version simplifiée du GitHub Flow.

- **main** : Branche stable et protégée.
- **dev** : Branche de référence protégée.
- **Branches de fonctionnalités** : `type/nom-feature`
  - `feat/` : Nouvelles fonctionnalités (ex: `feat/recherche-semantique`).
  - `fix/` : Corrections de bugs.
  - `hotfix/` : Corrections de bugs en production directement.
  - `docs/` : Documentation (Wiki, README).
  - `refactor/` : Amélioration du code sans changement fonctionnel.
  - `chore/` : Maintenance (dépendances, CI/CD).

## 2. Format des Commits

Les messages de commit doivent respecter la convention **Conventional Commits**.
Format : `type(scope): description`

- **Types** : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`.
- **Scopes** : `web`, `api`, `ai`, `ui`, `ci`, `db`, `infra`.
- **Description** : En minuscule, pas de point final.

## 3. Conventions de Nommage

### TypeScript (Web & API Gateway)

- **Fichiers & Dossiers** : `kebab-case`.
- **Composants React** : `PascalCase` (ex: `ResultsList.tsx`).
- **Fonctions & Variables** : `camelCase`.
- **Interfaces & Types** : `PascalCase` préfixé par `I` ou `T` (ex: `UserProgress`).

### Python (Service IA)

- **Respect de la PEP8**.
- **Fichiers & Variables** : `snake_case`.
- **Classes** : `PascalCase`.

### Base de données (PostgreSQL)

- **Tables & Colonnes** : `snake_case` (tables au pluriel).

## 4. Definition of Done (DoD)

Une tâche est considérée comme terminée si :

- Le code respecte les règles de linting (ESLint/Ruff).
- Les tests unitaires sont passants.
- La documentation est mise à jour (Wiki ou JSDoc).
- Les critères d'acceptation de l'User Story sont validés.
