# Shared API Definitions (`@repo/api`)

Ce package centralise les définitions des schémas de données (via Zod) et la spécification OpenAPI 3.0. Il est utilisé par le backend pour la validation et par le frontend pour la génération automatique du client API.

## 📁 Structure

- `src/schemas/`: Contient les schémas Zod pour chaque entité (Utilisateur, Programme, etc.).
- `src/openapi.ts`: Compile les schémas dans une spécification OpenAPI complète.
- `src/generate.ts`: Script pour exporter la spécification en fichier `openapi.json`.
- `openapi.json`: Le fichier généré (Source de vérité pour Orval).

## 🚀 Utilisation

Après avoir modifié un schéma dans `src/schemas/` :

```bash
pnpm generate-openapi
```

Cela mettra à jour le fichier `openapi.json`, ce qui déclenchera la régénération du client API dans `apps/web`.
