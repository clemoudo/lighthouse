# Web Application (`apps/web`)

L'interface utilisateur de Lighthouse, conçue pour offrir une expérience fluide et intuitive aux institutrices.

## 🛠️ Stack Technique

- **Framework**: Next.js 16 (App Router).
- **Design System**: Ant Design 6.
- **Styling**: Tailwind CSS v4.
- **Gestion d'état & API**: TanStack Query (React Query).
- **Formulaires**: TanStack Form + Zod.
- **Icônes**: Lucide React.

## 📁 Structure

- `src/app/`: Routes et pages (App Router).
- `src/components/`: Composants UI réutilisables.
- `src/hooks/`: Hooks React personnalisés.
- `src/lib/`: Utilitaires, client d'authentification et client API.
- `src/contexts/`: Contextes React (Auth, Providers).

## 🎨 Styling & Thème

Le projet utilise Tailwind CSS v4. Les variables de thème sont définies dans `src/app/globals.css` via des tokens CSS (`oklch`). Ant Design est configuré pour respecter ces variables via le `ConfigProvider`.
