# Web Application (Next.js)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Infrastructure:** Docker.
- **Styling:** Tailwind CSS v4 (CSS-first mode).
- **UI Library:** Ant Design 6.
- **API Client:** Orval (Auto-generated with TanStack Query).
- **State/Forms/Tables:** TanStack Query, TanStack Form (+ Zod).
- **Theming:** `next-themes` + Ant Design ConfigProvider.

## Critical Rules

- **Hydration:** Always include `suppressHydrationWarning` on the `<html>` tag in `layout.tsx` to prevent mismatches from theme scripts or extensions.
- **Ant Design Registry:** Ensure `AntdRegistry` from `@ant-design/nextjs-registry` wraps the application in `layout.tsx`.
- **API Generation:** Use `pnpm generate-api` to update the API client from the backend's OpenAPI spec. Generated code is located in `@repo/api` but used via React Query hooks.
- **Tailwind v4:** Variables and theme configuration are located in `src/app/globals.css`. Use `@theme inline` for custom tokens.
- **Icons:** Use `lucide-react`.

## Theme

- The application uses `oklch()` color tokens defined in `globals.css`.
- Ant Design tokens should be synchronized with Tailwind variables when possible via `ConfigProvider` in `Providers`.
