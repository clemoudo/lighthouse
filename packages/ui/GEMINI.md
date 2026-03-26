# UI Library (@repo/ui)

## Tech Stack

- **Base:** React 19 + TypeScript.
- **Primitives:** Radix UI (Monolithic package `radix-ui`).
- **Styling:** Tailwind CSS v4 compatible (using `class-variance-authority`, `clsx`, and `tailwind-merge`).

## Design Rules

- **Imports:** Use the monolithic package for Radix: `import { ... } from "radix-ui"`.
- **Tailwind v4 Compatibility:** Every component SHOULD include a `data-slot` attribute on its main elements to allow precise targeting in Tailwind v4.
- **Exports:** Every component MUST be exported in `src/index.ts`.
- **Utils:** Use `@repo/ui/lib/utils` (cn helper) for class merging.

## Component Structure

- Keep components small and focused.
- Favor composition over complex prop drilling.
