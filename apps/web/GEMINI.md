# Web Application (Next.js)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Styling:** Tailwind CSS v4 (CSS-first mode) + HeroUI v3.
- **State/Fetching:** TanStack Query.

## Critical Rules

- **Hydration:** Always include `suppressHydrationWarning` on the `<html>` tag in `layout.tsx` to prevent mismatches from theme scripts or extensions.
- **UI Components:** Use `@heroui/react` for UI components. Follow the compound component pattern (e.g., `Card.Header`).
- **Tailwind v4:** Variables and theme configuration are located in `src/app/globals.css`. Use `@theme inline` for custom tokens.
- **Icons:** Use `lucide-react`.

## Theme

- The application uses `oklch()` color tokens defined in `globals.css`.
- Sidebar and persistent UI elements should use themed variables (e.g., `var(--color-sidebar-bg)`).
