# Web Application (Next.js)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Styling:** Tailwind CSS v4 (CSS-first mode).
- **State/Fetching:** TanStack Query.

## Critical Rules

- **Hydration:** Always include `suppressHydrationWarning` on the `<html>` tag in `layout.tsx` to prevent mismatches from theme scripts or extensions.
- **UI Components:** Do NOT create local UI components in `apps/web/src/components` if they are generic. Use `@repo/ui` instead.
- **Tailwind v4:** Variables and theme configuration are located in `src/app/globals.css`. Use `@theme inline` for custom tokens.
- **Icons:** Use `lucide-react`.

## Component Addition

- When adding a component via shadcn CLI, use: `pnpm dlx shadcn@latest add <component> --cwd apps/web`.
- Ensure the component is moved to or created in `packages/ui` if it's meant to be shared.
